import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { security } from "@/lib/security";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createCreditsOnlySchema = z.object({
  orderData: z.object({
    userId: z.string().min(1),
    customerEmail: z.string().email(),
    customerName: z.string().min(1),
    customerDiscord: z
      .string()
      .min(1, "Discord username is required")
      .refine((discord) => security.validateDiscordTag(discord.trim()), {
        message: "Invalid Discord username format",
      }),
    orderNotes: z.string().optional(),
    specialInstructions: z.string().optional(),
    items: z.array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().positive().int(),
        unit_price: z.number().positive(),
        total_price: z.number().positive(),
        product_name: z.string(),
        product_type: z.enum(["service", "bundle", "custom_item"]),
        custom_options: z.record(z.any()).optional(),
      }),
    ),
    referralCode: z.string().optional(),
    referralDiscount: z.number().nonnegative().optional(),
    creditsUsed: z.number().nonnegative().default(0),
    ipAddress: z.string().optional(),
  }),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return res
        .status(500)
        .json({
          error: "Server configuration error",
          details: "Database access not configured",
        });
    }

    const parse = createCreditsOnlySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parse.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", "),
      });
    }

    const { orderData } = parse.data;

    // Calculate totals
    const subtotalAmount = orderData.items.reduce(
      (s, item) => s + item.total_price,
      0,
    );

    // Validate referral code discount server-side
    let validatedReferralDiscount = 0;
    if (orderData.referralCode && orderData.referralCode.trim()) {
      const { data: validation, error: validationError } = await supabase.rpc(
        "validate_referral_code",
        { code: orderData.referralCode.trim(), user_id: orderData.userId },
      );
      if (validationError) {
        return res
          .status(400)
          .json({
            error: "Invalid referral code",
            details: "Could not validate referral code",
          });
      }
      if (validation && (validation as any).valid) {
        if ((validation as any).type === "promo") {
          if ((validation as any).discount_type === "percentage") {
            validatedReferralDiscount =
              subtotalAmount * ((validation as any).discount_value / 100);
          } else {
            validatedReferralDiscount = Math.min(
              (validation as any).discount_value,
              subtotalAmount,
            );
          }
        } else {
          validatedReferralDiscount = subtotalAmount * 0.15;
        }
      } else {
        return res
          .status(400)
          .json({
            error: "Invalid referral code",
            details: (validation as any)?.error || "Code invalid or expired",
          });
      }
    }

    const taxAmount = Math.max(
      0,
      (subtotalAmount - validatedReferralDiscount) * 0.08,
    );
    const totalAmount = Math.max(
      0,
      subtotalAmount - validatedReferralDiscount + taxAmount,
    );

    // Fetch user credits and validate sufficient balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("id", orderData.userId)
      .single();

    if (profileError) {
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }

    const availableCredits = parseFloat(String(profile?.credit_balance || 0));

    if (availableCredits < totalAmount) {
      return res.status(400).json({
        error: "Insufficient credits",
        details: `Available: $${availableCredits.toFixed(2)}, required: $${totalAmount.toFixed(2)}`,
      });
    }

    // Deduct credits
    const newBalance = parseFloat((availableCredits - totalAmount).toFixed(2));
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        credit_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderData.userId);

    if (updateError) {
      return res.status(500).json({ error: "Failed to deduct credits" });
    }

    // Attempt to record transaction (best-effort)
    try {
      await supabase.from("credit_transactions").insert([
        {
          user_id: orderData.userId,
          amount: totalAmount,
          type: "debit",
          description: "Order paid with credits",
          balance_before: availableCredits,
          balance_after: newBalance,
          created_at: new Date().toISOString(),
        } as any,
      ]);
    } catch {}

    // Create unified order
    const orderRecord = {
      order_type: "standard",
      user_id: orderData.userId,
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName,
      customer_discord: orderData.customerDiscord,
      items: orderData.items,
      subtotal_amount: parseFloat(subtotalAmount.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      discount_amount: parseFloat(validatedReferralDiscount.toFixed(2)),
      credits_used: parseFloat(totalAmount.toFixed(2)),
      total_amount: 0,
      currency: "USD",
      status: "confirmed",
      payment_status: "paid",
      fulfillment_status: "unfulfilled",
      progress: 0,
      transaction_id: `credits_${Date.now()}`,
      payment_method: "credits",
      ip_address: orderData.ipAddress || null,
      referral_code: orderData.referralCode || null,
      referral_discount: parseFloat(validatedReferralDiscount.toFixed(2)),
      notes: orderData.orderNotes || null,
      special_instructions: orderData.specialInstructions || null,
      metadata: {
        created_via: "unified_cart_system",
        payment_amount_cents: 0,
        item_count: orderData.items.length,
        total_quantity: orderData.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        ),
      },
      status_history: [
        {
          status: "Order Created",
          created_at: new Date().toISOString(),
          description: "Order created and paid with credits",
        },
      ],
      confirmed_at: new Date().toISOString(),
    };

    const { data: createdOrder, error: createError } = await supabase
      .from("unified_orders")
      .insert([orderRecord])
      .select("id, order_number")
      .single();

    if (createError) {
      return res
        .status(500)
        .json({
          error: "Failed to create order",
          details: createError.message,
        });
    }

    return res.status(200).json({
      success: true,
      orderId: createdOrder.id,
      orderNumber: (createdOrder as any).order_number,
      transactionId: orderRecord.transaction_id,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({
        error: "Internal server error",
        details: error.message || String(error),
      });
  }
}

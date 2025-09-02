import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { security } from "@/lib/security";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20" as any,
  typescript: true,
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Request validation schema
const createUnifiedOrderSchema = z.object({
  paymentIntentId: z.string().min(1),
  orderData: z.object({
    userId: z.string().optional(),
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
    creditsUsed: z.number().nonnegative().optional(),
    ipAddress: z.string().optional(),
  }),
});

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_type: "service" | "bundle" | "custom_item";
  custom_options?: Record<string, any>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY environment variable");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Payment processing not configured",
      });
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("Missing Supabase environment variables");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Database access not configured",
      });
    }

    // Validate and parse request body
    const parseResult = createUnifiedOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parseResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", "),
      });
    }

    const { paymentIntentId, orderData } = parseResult.data;

    // Retrieve and verify the PaymentIntent from Stripe
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError: any) {
      console.error("Failed to retrieve PaymentIntent:", stripeError);
      return res.status(400).json({
        error: "Invalid payment",
        details: "Payment verification failed",
      });
    }

    // Verify payment was successful
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: "Payment not completed",
        details: `Payment status: ${paymentIntent.status}`,
      });
    }

    // Calculate totals and validate against payment intent
    const subtotalAmount = orderData.items.reduce(
      (sum, item) => sum + item.total_price,
      0,
    );
    const discountAmount = orderData.referralDiscount || 0;
    const creditsUsed = orderData.creditsUsed || 0;
    const subtotalAfterDiscount = subtotalAmount - discountAmount;
    const taxAmount = Math.max(0, subtotalAfterDiscount * 0.08); // 8% tax
    const totalAmount = Math.max(
      0.5,
      subtotalAfterDiscount + taxAmount - creditsUsed,
    );

    // Verify payment amount matches calculated total (within 1 cent tolerance)
    const paidAmount = paymentIntent.amount / 100; // Convert from cents
    if (Math.abs(paidAmount - totalAmount) > 0.01) {
      console.error("Payment amount mismatch:", {
        calculated: totalAmount,
        paid: paidAmount,
        difference: Math.abs(paidAmount - totalAmount),
      });
      return res.status(400).json({
        error: "Payment amount mismatch",
        details: "The payment amount doesn't match the calculated order total",
      });
    }

    // Check for existing order with this payment intent
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from("unified_orders")
      .select("id, order_number")
      .eq("transaction_id", paymentIntentId)
      .maybeSingle();

    if (existingOrderError) {
      console.error("Error checking for existing order:", existingOrderError);
      return res.status(500).json({
        error: "Database error",
        details: "Failed to check for existing orders",
      });
    }

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already exists",
        orderId: existingOrder.id,
        orderNumber: existingOrder.order_number,
        duplicate: true,
      });
    }

    // Validate credits availability and deduct if needed
    const creditsUsed = orderData.creditsUsed || 0;
    if (creditsUsed > 0 && orderData.userId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("id", orderData.userId)
        .single();

      if (profileError) {
        return res.status(500).json({ error: "Failed to fetch user profile" });
      }

      const availableCredits = parseFloat(String(profile?.credit_balance || 0));

      // Recompute totals to determine maximum usable credits
      const subtotalAmount = orderData.items.reduce((s, it) => s + it.total_price, 0);
      const discountAmount = orderData.referralDiscount || 0;
      const taxAmount = Math.max(0, (subtotalAmount - discountAmount) * 0.08);
      const maxUsableCredits = Math.max(0, subtotalAmount - discountAmount + taxAmount);

      const creditsToDeduct = Math.min(creditsUsed, availableCredits, maxUsableCredits);
      if (creditsToDeduct < creditsUsed - 0.001) {
        return res.status(400).json({ error: "Insufficient credits", details: `Available: $${availableCredits.toFixed(2)}` });
      }

      const newBalance = parseFloat((availableCredits - creditsToDeduct).toFixed(2));
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", orderData.userId);
      if (updateError) {
        return res.status(500).json({ error: "Failed to deduct credits" });
      }

      // Best-effort transaction log
      try {
        await supabase.from("credit_transactions").insert([
          {
            user_id: orderData.userId,
            amount: creditsToDeduct,
            type: "debit",
            description: "Credits applied to order",
            balance_before: availableCredits,
            balance_after: newBalance,
            created_at: new Date().toISOString(),
          } as any,
        ]);
      } catch {}
    }

    // Determine order type based on items
    let orderType: "standard" | "custom" | "bundle" = "standard";
    const hasCustomItems = orderData.items.some(
      (item) => item.product_type === "custom_item",
    );
    const hasBundles = orderData.items.some(
      (item) => item.product_type === "bundle",
    );
    const hasServices = orderData.items.some(
      (item) => item.product_type === "service",
    );

    if (hasCustomItems && !hasBundles && !hasServices) {
      orderType = "custom";
    } else if (hasBundles && !hasCustomItems && !hasServices) {
      orderType = "bundle";
    } else if (hasCustomItems || (hasBundles && hasServices)) {
      orderType = "custom"; // Mixed orders are treated as custom
    }

    // Server-side referral code validation if provided
    let validatedReferralDiscount = 0;
    if (orderData.referralCode && orderData.referralCode.trim()) {
      try {
        const { data: validation, error: validationError } = await supabase.rpc(
          "validate_referral_code",
          {
            code: orderData.referralCode.trim(),
            user_id: orderData.userId || null,
          },
        );

        if (validationError) {
          console.error(
            "Server-side referral validation error:",
            validationError,
          );
          return res.status(400).json({
            error: "Invalid referral code",
            details: "Could not validate referral code on server",
          });
        }

        if (validation && validation.valid) {
          if (validation.type === "promo") {
            if (validation.discount_type === "percentage") {
              validatedReferralDiscount =
                subtotalAmount * (validation.discount_value / 100);
            } else {
              validatedReferralDiscount = Math.min(
                validation.discount_value,
                subtotalAmount,
              );
            }
          } else {
            validatedReferralDiscount = subtotalAmount * 0.15; // 15% for referral codes
          }
        } else {
          return res.status(400).json({
            error: "Invalid referral code",
            details:
              validation?.error ||
              "The referral code is not valid or has expired",
          });
        }
      } catch (err) {
        console.error("Error during referral code validation:", err);
        return res.status(400).json({
          error: "Invalid referral code",
          details: "Could not validate the provided referral code",
        });
      }
    }

    // Create unified order record
    const orderRecord = {
      order_type: orderType,
      user_id: orderData.userId || null,
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName,
      customer_discord: orderData.customerDiscord,
      items: orderData.items,
      subtotal_amount: parseFloat(subtotalAmount.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      discount_amount: parseFloat(validatedReferralDiscount.toFixed(2)),
      credits_used: parseFloat((orderData.creditsUsed || 0).toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2)),
      currency: "USD",
      status: "confirmed",
      payment_status: "paid",
      fulfillment_status: "unfulfilled",
      progress: 0,
      transaction_id: paymentIntentId,
      payment_method: paymentIntent.payment_method_types?.[0] || "unknown",
      ip_address: orderData.ipAddress || null,
      referral_code: orderData.referralCode || null,
      referral_discount: parseFloat(validatedReferralDiscount.toFixed(2)),
      notes: orderData.orderNotes || null,
      special_instructions: orderData.specialInstructions || null,
      metadata: {
        stripe_payment_intent: paymentIntentId,
        created_via: "unified_cart_system",
        payment_amount_cents: paymentIntent.amount,
        calculated_total: totalAmount,
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
          description: "Order successfully created and payment confirmed",
        },
      ],
      confirmed_at: new Date().toISOString(),
    };

    // Insert the unified order
    const { data: createdOrder, error: createError } = await supabase
      .from("unified_orders")
      .insert([orderRecord])
      .select("id, order_number, order_type")
      .single();

    if (createError) {
      console.error("Failed to create unified order:", createError);
      return res.status(500).json({
        error: "Failed to create order",
        details: createError.message,
      });
    }

    console.log("Unified order created successfully:", {
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
      orderType: createdOrder.order_type,
      totalAmount: totalAmount,
      itemCount: orderData.items.length,
    });

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
      orderType: createdOrder.order_type,
      totalAmount: totalAmount,
      paymentIntentId: paymentIntentId,
    });
  } catch (error: any) {
    console.error("Error in unified order creation:", error);

    const errorMessage = error.message || "Failed to create order";
    const errorCode = error.code || "UNKNOWN_ERROR";

    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}

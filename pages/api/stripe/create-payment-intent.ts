import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Initialize Supabase with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Request validation schema
const createPaymentIntentSchema = z.object({
  services: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().positive().int(),
    }),
  ),
  customOrderData: z
    .object({
      items: z.array(
        z.object({
          category: z.string(),
          item_name: z.string(),
          quantity: z.number().positive().int(),
          price_per_unit: z.number().positive(),
          total_price: z.number().positive(),
          description: z.string().optional(),
        }),
      ),
      special_instructions: z.string().optional(),
      customer_discord: z.string().optional(),
    })
    .optional(),
  referralCode: z.string().optional(),
  referralDiscount: z.number().nonnegative().optional(),
  creditsUsed: z.number().nonnegative().optional(),
  currency: z.string().default("usd"),
  metadata: z.record(z.string()).optional(),
});

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
      console.error("Missing STRIPE_SECRET_KEY");
      return res
        .status(500)
        .json({ error: "Payment service configuration error" });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return res.status(500).json({ error: "Database configuration error" });
    }

    // Validate and parse request body
    const parseResult = createPaymentIntentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parseResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", "),
      });
    }

    const {
      services,
      customOrderData,
      referralCode,
      referralDiscount = 0,
      creditsUsed = 0,
      currency,
      metadata = {},
    } = parseResult.data;

    // Fetch actual service prices from database
    let servicesTotal = 0;
    if (services.length > 0) {
      const serviceIds = services.map((s) => s.id);
      const { data: dbServices, error: servicesError } = await supabase
        .from("services")
        .select("id, price, active")
        .in("id", serviceIds)
        .eq("active", true);

      if (servicesError) {
        console.error("Error fetching services:", servicesError);
        return res
          .status(500)
          .json({ error: "Failed to fetch service pricing" });
      }

      // Verify all requested services exist and are active
      const foundServiceIds = new Set(dbServices?.map((s) => s.id) || []);
      const missingServices = serviceIds.filter(
        (id) => !foundServiceIds.has(id),
      );
      if (missingServices.length > 0) {
        return res.status(400).json({
          error: "Invalid services requested",
          details: `Services not found or inactive: ${missingServices.join(", ")}`,
        });
      }

      // Calculate total using database prices
      const servicesPriceMap = new Map(dbServices!.map((s) => [s.id, s.price]));
      servicesTotal = services.reduce((sum, serviceRequest) => {
        const dbPrice = servicesPriceMap.get(serviceRequest.id)!;
        return sum + dbPrice * serviceRequest.quantity;
      }, 0);
    }

    // Calculate custom order total (these are pre-calculated by admin)
    let customOrderTotal = 0;
    if (customOrderData?.items) {
      customOrderTotal = customOrderData.items.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );
    }

    // Server-side promo code validation for security
    let validatedReferralDiscount = 0;
    if (referralCode && referralCode.trim()) {
      try {
        const { data: validation, error: validationError } = await supabase
          .rpc('validate_referral_code', {
            code: referralCode.trim(),
            user_id: null, // We don't require user ID for validation
          });

        if (validationError) {
          console.error("Error validating referral code:", validationError);
          return res.status(400).json({
            error: "Invalid promo code",
            details: "Could not validate the provided promo code",
          });
        }

        if (validation && validation.valid) {
          // Apply the discount based on the subtotal
          const subtotalBeforeDiscount = servicesTotal + customOrderTotal;
          validatedReferralDiscount = Math.min(
            referralDiscount,
            subtotalBeforeDiscount * 0.15 // Max 15% discount for safety
          );
        } else {
          return res.status(400).json({
            error: "Invalid promo code",
            details: validation?.error || "The promo code is not valid or has expired",
          });
        }
      } catch (err) {
        console.error("Error during promo code validation:", err);
        return res.status(400).json({
          error: "Invalid promo code",
          details: "Could not validate the provided promo code",
        });
      }
    } else if (referralDiscount > 0) {
      // If no code provided but discount claimed, reject
      return res.status(400).json({
        error: "Missing promo code",
        details: "Promo code is required to apply discount",
      });
    }

    // Calculate final amount with validated values
    const TAX_RATE = 0.08;
    const subtotal = servicesTotal + customOrderTotal;
    const totalBeforeCredits = subtotal - validatedReferralDiscount;
    const tax = Math.max(0, totalBeforeCredits * TAX_RATE);

    // Validate credits used don't exceed reasonable limits
    const maxCreditsUsable = totalBeforeCredits + tax;
    const validatedCreditsUsed = Math.min(creditsUsed, maxCreditsUsable);

    const finalAmount = Math.max(0, totalBeforeCredits + tax - validatedCreditsUsed);

    // Minimum charge validation (Stripe minimum is $0.50)
    if (finalAmount < 0.5) {
      return res.status(400).json({
        error: "Order total too low",
        details: "Minimum payment amount is $0.50",
      });
    }

    // Create payment intent with server-calculated amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency,
      metadata: {
        ...metadata,
        servicesTotal: servicesTotal.toString(),
        customOrderTotal: customOrderTotal.toString(),
        subtotal: subtotal.toString(),
        referralDiscount: referralDiscount.toString(),
        creditsUsed: creditsUsed.toString(),
        tax: tax.toString(),
        finalAmount: finalAmount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: finalAmount,
      breakdown: {
        servicesTotal,
        customOrderTotal,
        subtotal,
        referralDiscount,
        tax,
        creditsUsed,
        finalAmount,
      },
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeRateLimitError") {
      return res.status(429).json({
        error: "Too many requests. Please wait a moment and try again.",
      });
    }

    if (error.type === "StripeInvalidRequestError") {
      return res.status(400).json({
        error: error.message || "Invalid request parameters",
      });
    }

    if (error.type === "StripeAuthenticationError") {
      return res.status(401).json({
        error: "Authentication failed. Please contact support.",
      });
    }

    // Generic error - ensure JSON response
    res.status(500).json({
      error: error.message || "Failed to create payment intent",
      details:
        "An unexpected error occurred while creating the payment intent. Please try again.",
    });
  }
}

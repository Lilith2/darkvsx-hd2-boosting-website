import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
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

    // Calculate final amount
    const TAX_RATE = 0.08;
    const subtotal = servicesTotal + customOrderTotal;
    const totalBeforeCredits = subtotal - referralDiscount;
    const tax = Math.max(0, totalBeforeCredits * TAX_RATE);
    const finalAmount = Math.max(0, totalBeforeCredits + tax - creditsUsed);

    // Minimum charge validation (Stripe minimum is $0.50)
    if (finalAmount < 0.5) {
      return res.status(400).json({
        error: "Order total too low",
        details: "Minimum payment amount is $0.50",
      });
    }

    // Configure payment methods - enable all available methods
    const paymentMethodTypes = [
      "card",
      "us_bank_account",
      "link",
      "apple_pay",
      "google_pay",
      "amazon_pay",
      "venmo",
      "cashapp",
      "klarna",
      "affirm",
      "afterpay_clearpay",
      "alipay",
      "acss_debit",
      "bacs_debit",
      "bancontact",
      "eps",
      "giropay",
      "ideal",
      "p24",
      "sepa_debit",
      "sofort",
    ];

    // Create payment intent with comprehensive payment method support
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        servicesTotal: servicesTotal.toString(),
        customOrderTotal: customOrderTotal.toString(),
        subtotal: subtotal.toString(),
        referralDiscount: referralDiscount.toString(),
        creditsUsed: creditsUsed.toString(),
        tax: tax.toString(),
        finalAmount: finalAmount.toString(),
        venmo_capability: process.env.STRIPE_VENMO_CAPABILITY || "",
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      payment_method_types: paymentMethodTypes,
      setup_future_usage: "off_session", // Allow saving payment methods for future use
      receipt_email: metadata.userEmail,
      shipping: {
        name: metadata.userName || "Customer",
        address: {
          line1: "Digital Service",
          city: "Online",
          state: "Digital",
          postal_code: "00000",
          country: "US",
        },
      },
    };

    // Add Venmo-specific configuration if capability is available
    if (process.env.STRIPE_VENMO_CAPABILITY) {
      paymentIntentParams.payment_method_configuration =
        process.env.STRIPE_VENMO_CAPABILITY;
    }

    const paymentIntent =
      await stripe.paymentIntents.create(paymentIntentParams);

    // Log successful creation for debugging
    console.log("Payment Intent created successfully:", {
      id: paymentIntent.id,
      amount: finalAmount,
      currency: currency,
      payment_method_types: paymentIntent.payment_method_types,
      automatic_payment_methods: paymentIntent.automatic_payment_methods,
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: finalAmount,
      currency: currency,
      supportedPaymentMethods: paymentIntent.payment_method_types,
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

    // Enhanced error handling
    if (error.type === "StripeRateLimitError") {
      return res.status(429).json({
        error: "Too many requests. Please wait a moment and try again.",
      });
    }

    if (error.type === "StripeInvalidRequestError") {
      console.error("Stripe Invalid Request:", error.message, error.param);
      return res.status(400).json({
        error: error.message || "Invalid request parameters",
        details: error.param ? `Invalid parameter: ${error.param}` : undefined,
      });
    }

    if (error.type === "StripeAuthenticationError") {
      console.error("Stripe Authentication Error:", error.message);
      return res.status(401).json({
        error: "Authentication failed. Please contact support.",
      });
    }

    if (error.type === "StripeConnectionError") {
      return res.status(502).json({
        error: "Connection to payment processor failed. Please try again.",
      });
    }

    if (error.type === "StripeAPIError") {
      console.error("Stripe API Error:", error.message);
      return res.status(500).json({
        error: "Payment processor error. Please try again or contact support.",
      });
    }

    // Generic error with more details for debugging
    console.error("Unexpected payment error:", {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      stack: error.stack,
    });

    res.status(500).json({
      error: error.message || "Failed to create payment intent",
      details:
        "An unexpected error occurred while creating the payment intent. Please try again.",
    });
  }
}

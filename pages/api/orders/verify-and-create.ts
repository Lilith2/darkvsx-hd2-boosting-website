import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Stripe according to official documentation
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  typescript: true,
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CustomOrderItem {
  category: string;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  description?: string;
}

// Request validation schema
const verifyPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  orderData: z.object({
    userId: z.string().optional(),
    customerEmail: z.string().email(),
    customerName: z.string().min(1),
    services: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(), // This will be ignored - we'll fetch from DB
        quantity: z.number().positive().int(),
      }),
    ),
    notes: z.string().optional(),
    referralCode: z.string().optional(),
    referralDiscount: z.number().nonnegative().optional(),
    referralCreditsUsed: z.number().nonnegative().optional(),
    ipAddress: z.string().optional(),
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
  }),
});

interface VerifyPaymentRequest {
  paymentIntentId: string;
  orderData: {
    userId?: string;
    customerEmail: string;
    customerName: string;
    services: OrderItem[];
    notes?: string;
    referralCode?: string;
    referralDiscount?: number;
    referralCreditsUsed?: number;
    ipAddress?: string;
    customOrderData?: {
      items: CustomOrderItem[];
      special_instructions?: string;
      customer_discord?: string;
    };
  };
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
    const parseResult = verifyPaymentSchema.safeParse(req.body);
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

    // Calculate expected total using SERVER-SIDE prices (SECURITY: Never trust client prices)
    const TAX_RATE = 0.08;
    let servicesTotal = 0;

    // Fetch actual service prices from database - CRITICAL SECURITY
    if (orderData.services.length > 0) {
      const serviceIds = orderData.services.map((s) => s.id);
      const { data: dbServices, error: servicesError } = await supabase
        .from("services")
        .select("id, price, active, title")
        .in("id", serviceIds)
        .eq("active", true);

      if (servicesError) {
        console.error(
          "Error fetching services for verification:",
          servicesError,
        );
        return res.status(500).json({
          error: "Failed to verify service pricing",
        });
      }

      // Verify all requested services exist and are active
      const foundServiceIds = new Set(dbServices?.map((s) => s.id) || []);
      const missingServices = serviceIds.filter(
        (id) => !foundServiceIds.has(id),
      );
      if (missingServices.length > 0) {
        return res.status(400).json({
          error: "Invalid services in order",
          details: `Services not found or inactive: ${missingServices.join(", ")}`,
        });
      }

      // Calculate total using DATABASE prices (not client-provided prices)
      const servicesPriceMap = new Map(dbServices!.map((s) => [s.id, s.price]));
      servicesTotal = orderData.services.reduce((sum, serviceRequest) => {
        const dbPrice = servicesPriceMap.get(serviceRequest.id);
        if (!dbPrice) {
          throw new Error(`Price not found for service ${serviceRequest.id}`);
        }
        return sum + dbPrice * serviceRequest.quantity;
      }, 0);
    }

    // Add custom order items if present
    let customOrderTotal = 0;
    if (orderData.customOrderData?.items) {
      customOrderTotal = orderData.customOrderData.items.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );
    }

    const subtotal = servicesTotal + customOrderTotal;
    const discountAmount = orderData.referralDiscount || 0;
    const creditsUsed = orderData.referralCreditsUsed || 0;
    const totalBeforeCredits = subtotal - discountAmount;
    const tax = Math.max(0, totalBeforeCredits * TAX_RATE);
    const expectedTotal = Math.max(0, totalBeforeCredits + tax - creditsUsed);

    // Verify the payment amount matches expected total (with small tolerance for rounding)
    const paidAmount = paymentIntent.amount / 100; // Convert from cents
    const tolerance = 0.01; // 1 cent tolerance

    if (Math.abs(paidAmount - expectedTotal) > tolerance) {
      console.error("Payment amount mismatch:", {
        paid: paidAmount,
        expected: expectedTotal,
        difference: Math.abs(paidAmount - expectedTotal),
      });
      return res.status(400).json({
        error: "Payment amount mismatch",
        details: "Payment amount does not match order total",
      });
    }

    // Check if order already exists with this transaction ID (idempotency)
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("transaction_id", paymentIntentId)
      .single();

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already exists",
        orderId: existingOrder.id,
        duplicate: true,
      });
    }

    // Create the order(s) in the database
    const results = await createOrdersInDatabase(
      orderData,
      paymentIntentId,
      expectedTotal,
    );

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      ...results,
    });
  } catch (error: any) {
    console.error("Error in verify-and-create endpoint:", error);

    // Ensure we always return proper JSON
    const errorMessage = error.message || "Failed to process order";
    const errorCode = error.code || "UNKNOWN_ERROR";

    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}

async function createOrdersInDatabase(
  orderData: VerifyPaymentRequest["orderData"],
  transactionId: string,
  totalAmount: number,
) {
  const results: any = {};

  // Create regular order if there are services
  if (orderData.services && orderData.services.length > 0) {
    const orderRecord = {
      user_id: orderData.userId || null,
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName,
      items: orderData.services.map((service) => ({
        service_id: service.id,
        service_name: service.name,
        price: service.price,
        quantity: service.quantity,
      })),
      status: "pending",
      payment_status: "paid",
      total_amount: parseFloat(totalAmount.toFixed(2)), // Fix precision
      notes: orderData.notes || null,
      transaction_id: transactionId,
      referral_code: orderData.referralCode || null,
      referral_discount: orderData.referralDiscount
        ? parseFloat(orderData.referralDiscount.toFixed(2))
        : null,
      referral_credits_used: orderData.referralCreditsUsed
        ? parseFloat(orderData.referralCreditsUsed.toFixed(2))
        : null,
      ip_address: orderData.ipAddress || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderRecord])
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    results.orderId = order.id;
  }

  // Create custom order if there is custom order data
  if (
    orderData.customOrderData?.items &&
    orderData.customOrderData.items.length > 0
  ) {
    const customOrderRecord = {
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName,
      customer_discord: orderData.customOrderData.customer_discord || null,
      items: orderData.customOrderData.items,
      special_instructions:
        orderData.customOrderData.special_instructions ||
        orderData.notes ||
        null,
      status: "pending",
      total_amount: parseFloat(
        orderData.customOrderData.items
          .reduce((sum, item) => sum + item.total_price, 0)
          .toFixed(2),
      ), // Fix precision
      currency: "USD",
      transaction_id: transactionId,
      referral_code: orderData.referralCode || null,
      referral_discount: orderData.referralDiscount
        ? parseFloat(orderData.referralDiscount.toFixed(2))
        : null,
      user_id: orderData.userId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: customOrder, error: customOrderError } = await supabase
      .from("custom_orders")
      .insert([customOrderRecord])
      .select()
      .single();

    if (customOrderError) {
      throw new Error(
        `Failed to create custom order: ${customOrderError.message}`,
      );
    }

    results.customOrderId = customOrder.id;
  }

  return results;
}

import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Initialize Supabase with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
  description: string;
}

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
      console.error("Missing STRIPE_SECRET_KEY");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Payment processing not configured",
      });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Database access not configured",
      });
    }

    const { paymentIntentId, orderData }: VerifyPaymentRequest = req.body;

    // Validate required fields
    if (!paymentIntentId || !orderData) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "paymentIntentId and orderData are required",
      });
    }

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

    // Calculate expected total from order data (server-side validation)
    const TAX_RATE = 0.08;
    const subtotal = orderData.services.reduce(
      (sum, service) => sum + service.price * service.quantity,
      0,
    );

    // Add custom order items if present
    let customOrderTotal = 0;
    if (orderData.customOrderData?.items) {
      customOrderTotal = orderData.customOrderData.items.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );
    }

    const totalBeforeDiscounts = subtotal + customOrderTotal;
    const discountAmount = orderData.referralDiscount || 0;
    const creditsUsed = orderData.referralCreditsUsed || 0;
    const tax = (totalBeforeDiscounts - discountAmount) * TAX_RATE;
    const expectedTotal = Math.max(
      0,
      totalBeforeDiscounts - discountAmount + tax - creditsUsed,
    );

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

    return res.status(500).json({
      error: "Internal server error",
      details: error.message || "Failed to process order",
      code: error.code || "UNKNOWN_ERROR",
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
      // FIX: Use 'services' field instead of 'items'
      services: orderData.services.map((service) => ({
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
      // FIX: Use 'credits_used' instead of 'referral_credits_used'
      credits_used: orderData.referralCreditsUsed
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
      // FIX: Use 'payment_intent_id' instead of 'transaction_id'
      payment_intent_id: transactionId,
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

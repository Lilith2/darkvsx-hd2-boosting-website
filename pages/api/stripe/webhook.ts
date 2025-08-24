import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Initialize Supabase with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Disable the default body parser to handle raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the signature from the request headers
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("Missing stripe-signature header");
      return res.status(400).json({ error: "Missing stripe signature" });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // Get the raw body
    const rawBody = await buffer(req);

    let event: Stripe.Event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    console.log(`Received webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.processing":
        await handlePaymentIntentProcessing(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.requires_action":
        await handlePaymentIntentRequiresAction(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);

  try {
    // Check if we already have orders for this payment intent
    const { data: existingOrders } = await supabase
      .from("orders")
      .select("id, status")
      .eq("transaction_id", paymentIntent.id);

    const { data: existingCustomOrders } = await supabase
      .from("custom_orders")
      .select("id, status")
      .eq("payment_intent_id", paymentIntent.id);

    // If orders already exist and are paid, no action needed
    if (
      (existingOrders && existingOrders.length > 0) ||
      (existingCustomOrders && existingCustomOrders.length > 0)
    ) {
      console.log(`Orders already exist for PaymentIntent ${paymentIntent.id}`);

      // Update status to paid if not already
      if (existingOrders && existingOrders.length > 0) {
        await supabase
          .from("orders")
          .update({ payment_status: "paid", status: "pending" })
          .eq("transaction_id", paymentIntent.id)
          .neq("payment_status", "paid");
      }

      if (existingCustomOrders && existingCustomOrders.length > 0) {
        await supabase
          .from("custom_orders")
          .update({ status: "processing" })
          .eq("payment_intent_id", paymentIntent.id)
          .eq("status", "pending");
      }

      return;
    }

    // If no orders exist, log for manual review
    // This might happen if the client-side order creation failed
    console.warn(
      `PaymentIntent succeeded but no orders found: ${paymentIntent.id}`,
    );
    console.warn("This requires manual order creation or investigation");

    // You could implement automatic order creation here if you store
    // order data in the PaymentIntent metadata
    if (
      paymentIntent.metadata &&
      Object.keys(paymentIntent.metadata).length > 0
    ) {
      console.log("PaymentIntent metadata:", paymentIntent.metadata);
      // Could implement order creation from metadata here
    }
  } catch (error: any) {
    console.error(
      `Error handling payment success for ${paymentIntent.id}:`,
      error,
    );
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent failed: ${paymentIntent.id}`);

  try {
    // Update any existing orders to failed status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", paymentIntent.id);

    if (orderError) {
      console.error("Error updating failed order status:", orderError);
    }

    // Update any existing custom orders to failed status
    const { error: customOrderError } = await supabase
      .from("custom_orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    if (customOrderError) {
      console.error(
        "Error updating failed custom order status:",
        customOrderError,
      );
    }

    console.log(
      `Updated orders to failed status for PaymentIntent ${paymentIntent.id}`,
    );
  } catch (error: any) {
    console.error(
      `Error handling payment failure for ${paymentIntent.id}:`,
      error,
    );
    throw error;
  }
}

async function handlePaymentIntentProcessing(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(`PaymentIntent processing: ${paymentIntent.id}`);

  try {
    // Update any existing orders to processing status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", paymentIntent.id);

    if (orderError) {
      console.error("Error updating processing order status:", orderError);
    }

    // Update any existing custom orders to processing status
    const { error: customOrderError } = await supabase
      .from("custom_orders")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    if (customOrderError) {
      console.error(
        "Error updating processing custom order status:",
        customOrderError,
      );
    }
  } catch (error: any) {
    console.error(
      `Error handling payment processing for ${paymentIntent.id}:`,
      error,
    );
    throw error;
  }
}

async function handlePaymentIntentRequiresAction(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(`PaymentIntent requires action: ${paymentIntent.id}`);

  try {
    // Update any existing orders to require action status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "requires_action",
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", paymentIntent.id);

    if (orderError) {
      console.error("Error updating requires_action order status:", orderError);
    }

    // Update any existing custom orders to require action status
    const { error: customOrderError } = await supabase
      .from("custom_orders")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    if (customOrderError) {
      console.error(
        "Error updating requires_action custom order status:",
        customOrderError,
      );
    }
  } catch (error: any) {
    console.error(
      `Error handling payment requires action for ${paymentIntent.id}:`,
      error,
    );
    throw error;
  }
}

async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(`PaymentIntent canceled: ${paymentIntent.id}`);

  try {
    // Update any existing orders to canceled status
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "canceled",
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", paymentIntent.id);

    if (orderError) {
      console.error("Error updating canceled order status:", orderError);
    }

    // Update any existing custom orders to canceled status
    const { error: customOrderError } = await supabase
      .from("custom_orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    if (customOrderError) {
      console.error(
        "Error updating canceled custom order status:",
        customOrderError,
      );
    }
  } catch (error: any) {
    console.error(
      `Error handling payment cancellation for ${paymentIntent.id}:`,
      error,
    );
    throw error;
  }
}

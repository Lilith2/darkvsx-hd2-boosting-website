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
  // Security: Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      allowed: ["POST"]
    });
  }

  const startTime = Date.now();
  let event: Stripe.Event;

  try {
    // Get the signature from the request headers
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("Missing stripe-signature header");
      return res.status(400).json({
        error: "Missing stripe signature",
        details: "Webhook signature is required for security"
      });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
      return res.status(500).json({
        error: "Webhook secret not configured",
        details: "Server configuration error"
      });
    }

    // Get the raw body with size limit for security
    let rawBody: Buffer;
    try {
      rawBody = await buffer(req, {
        limit: '1mb' // Limit webhook payload size
      });
    } catch (bufferError: any) {
      console.error("Error reading webhook body:", bufferError);
      return res.status(400).json({
        error: "Invalid request body",
        details: "Could not parse webhook payload"
      });
    }

    // Verify the webhook signature with enhanced error handling
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", {
        error: err.message,
        type: err.type,
        headers: {
          'stripe-signature': sig ? 'present' : 'missing',
          'content-length': req.headers['content-length'],
        }
      });

      return res.status(400).json({
        error: "Webhook signature verification failed",
        details: err.message,
        type: err.type
      });
    }

    // Log event with timing
    console.log(`[${new Date().toISOString()}] Received webhook event: ${event.type} (ID: ${event.id})`);

    // Handle the event with enhanced error handling
    try {
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
          console.log(`Unhandled event type: ${event.type} (ID: ${event.id})`);
          // Still return success for unhandled but valid events
      }
    } catch (handlerError: any) {
      console.error(`Error handling ${event.type} event:`, {
        eventId: event.id,
        error: handlerError.message,
        stack: handlerError.stack
      });

      // Don't fail the webhook for individual handler errors
      // Stripe will retry if we return an error status
      console.warn(`Handler failed for ${event.type}, but acknowledging webhook to prevent retries`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Webhook ${event.type} processed in ${processingTime}ms`);

    // Return a response to acknowledge receipt of the event
    res.status(200).json({
      received: true,
      eventId: event.id,
      eventType: event.type,
      processingTime: processingTime
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("Webhook handler critical error:", {
      error: error.message,
      stack: error.stack,
      processingTime,
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'stripe-signature': req.headers['stripe-signature'] ? 'present' : 'missing'
      }
    });

    res.status(500).json({
      error: "Webhook handler failed",
      details: "Internal server error processing webhook",
      timestamp: new Date().toISOString()
    });
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Processing PaymentIntent succeeded: ${paymentIntent.id} (Amount: $${(paymentIntent.amount / 100).toFixed(2)})`);

  try {
    // Check if we already have orders for this payment intent
    const { data: existingOrders, error: ordersQueryError } = await supabase
      .from("orders")
      .select("id, status, payment_status")
      .eq("transaction_id", paymentIntent.id);

    if (ordersQueryError) {
      console.error(`Database error querying orders for ${paymentIntent.id}:`, ordersQueryError);
      throw new Error(`Database query failed: ${ordersQueryError.message}`);
    }

    const { data: existingCustomOrders, error: customOrdersQueryError } = await supabase
      .from("custom_orders")
      .select("id, status")
      .eq("payment_intent_id", paymentIntent.id);

    if (customOrdersQueryError) {
      console.error(`Database error querying custom orders for ${paymentIntent.id}:`, customOrdersQueryError);
      throw new Error(`Database query failed: ${customOrdersQueryError.message}`);
    }

    // If orders already exist, update their status
    if (existingOrders && existingOrders.length > 0) {
      console.log(`Found ${existingOrders.length} existing orders for PaymentIntent ${paymentIntent.id}`);

      const ordersToUpdate = existingOrders.filter(order => order.payment_status !== "paid");
      if (ordersToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "pending",
            updated_at: new Date().toISOString()
          })
          .eq("transaction_id", paymentIntent.id)
          .neq("payment_status", "paid");

        if (updateError) {
          console.error(`Error updating orders for ${paymentIntent.id}:`, updateError);
          throw new Error(`Failed to update orders: ${updateError.message}`);
        }
        console.log(`Updated ${ordersToUpdate.length} orders to paid status`);
      }
    }

    if (existingCustomOrders && existingCustomOrders.length > 0) {
      console.log(`Found ${existingCustomOrders.length} existing custom orders for PaymentIntent ${paymentIntent.id}`);

      const customOrdersToUpdate = existingCustomOrders.filter(order => order.status === "pending");
      if (customOrdersToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("custom_orders")
          .update({
            status: "processing",
            updated_at: new Date().toISOString()
          })
          .eq("payment_intent_id", paymentIntent.id)
          .eq("status", "pending");

        if (updateError) {
          console.error(`Error updating custom orders for ${paymentIntent.id}:`, updateError);
          throw new Error(`Failed to update custom orders: ${updateError.message}`);
        }
        console.log(`Updated ${customOrdersToUpdate.length} custom orders to processing status`);
      }
    }

    // If no orders exist, this might be expected (order created via verify-and-create endpoint)
    if ((!existingOrders || existingOrders.length === 0) &&
        (!existingCustomOrders || existingCustomOrders.length === 0)) {
      console.warn(`PaymentIntent succeeded but no orders found: ${paymentIntent.id}`);
      console.warn("This might be normal if orders are created via the verify-and-create endpoint");

      // Log metadata for debugging
      if (paymentIntent.metadata && Object.keys(paymentIntent.metadata).length > 0) {
        console.log("PaymentIntent metadata:", JSON.stringify(paymentIntent.metadata, null, 2));
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`PaymentIntent ${paymentIntent.id} success handler completed in ${processingTime}ms`);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`Error handling payment success for ${paymentIntent.id} (took ${processingTime}ms):`, {
      error: error.message,
      stack: error.stack,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount
    });
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

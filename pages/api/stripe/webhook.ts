import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe according to official documentation
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
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
      allowed: ["POST"],
    });
  }

  const startTime = Date.now();
  let event: Stripe.Event;

  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing Stripe environment variables");
      return res.status(500).json({
        error: "Payment service configuration error",
        details: "Stripe not properly configured",
      });
    }
    // Get the signature from the request headers
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("Missing stripe-signature header");
      return res.status(400).json({
        error: "Missing stripe signature",
        details: "Webhook signature is required for security",
      });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
      return res.status(500).json({
        error: "Webhook secret not configured",
        details: "Server configuration error",
      });
    }

    // Get the raw body with size limit for security
    let rawBody: Buffer;
    try {
      rawBody = await buffer(req, {
        limit: "1mb", // Limit webhook payload size
      });
    } catch (bufferError: any) {
      console.error("Error reading webhook body:", bufferError);
      return res.status(400).json({
        error: "Invalid request body",
        details: "Could not parse webhook payload",
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
          "stripe-signature": sig ? "present" : "missing",
          "content-length": req.headers["content-length"],
        },
      });

      return res.status(400).json({
        error: "Webhook signature verification failed",
        details: err.message,
        type: err.type,
      });
    }

    // Log event with timing
    console.log(
      `[${new Date().toISOString()}] Received webhook event: ${event.type} (ID: ${event.id})`,
    );

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
        stack: handlerError.stack,
      });

      // Don't fail the webhook for individual handler errors
      // Stripe will retry if we return an error status
      console.warn(
        `Handler failed for ${event.type}, but acknowledging webhook to prevent retries`,
      );
    }

    const processingTime = Date.now() - startTime;
    console.log(`Webhook ${event.type} processed in ${processingTime}ms`);

    // Return a response to acknowledge receipt of the event
    res.status(200).json({
      received: true,
      eventId: event.id,
      eventType: event.type,
      processingTime: processingTime,
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("Webhook handler critical error:", {
      error: error.message,
      stack: error.stack,
      processingTime,
      headers: {
        "content-type": req.headers["content-type"],
        "content-length": req.headers["content-length"],
        "stripe-signature": req.headers["stripe-signature"]
          ? "present"
          : "missing",
      },
    });

    res.status(500).json({
      error: "Webhook handler failed",
      details: "Internal server error processing webhook",
      timestamp: new Date().toISOString(),
    });
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const startTime = Date.now();
  console.log(
    `[${new Date().toISOString()}] Processing PaymentIntent succeeded: ${paymentIntent.id} (Amount: $${(paymentIntent.amount / 100).toFixed(2)})`,
  );

  try {
    // Check if we already have orders for this payment intent
    const { data: existingOrders, error: ordersQueryError } = await supabase
      .from("orders")
      .select("id, status, payment_status")
      .eq("transaction_id", paymentIntent.id);

    if (ordersQueryError) {
      console.error(
        `Database error querying orders for ${paymentIntent.id}:`,
        ordersQueryError,
      );
      throw new Error(`Database query failed: ${ordersQueryError.message}`);
    }

    const { data: existingCustomOrders, error: customOrdersQueryError } =
      await supabase
        .from("custom_orders")
        .select("id, status")
        .eq("payment_intent_id", paymentIntent.id);

    if (customOrdersQueryError) {
      console.error(
        `Database error querying custom orders for ${paymentIntent.id}:`,
        customOrdersQueryError,
      );
      throw new Error(
        `Database query failed: ${customOrdersQueryError.message}`,
      );
    }

    // If orders already exist, update their status
    if (existingOrders && existingOrders.length > 0) {
      console.log(
        `Found ${existingOrders.length} existing orders for PaymentIntent ${paymentIntent.id}`,
      );

      const ordersToUpdate = existingOrders.filter(
        (order) => order.payment_status !== "paid",
      );
      if (ordersToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("transaction_id", paymentIntent.id)
          .neq("payment_status", "paid");

        if (updateError) {
          console.error(
            `Error updating orders for ${paymentIntent.id}:`,
            updateError,
          );
          throw new Error(`Failed to update orders: ${updateError.message}`);
        }
        console.log(`Updated ${ordersToUpdate.length} orders to paid status`);
      }
    }

    if (existingCustomOrders && existingCustomOrders.length > 0) {
      console.log(
        `Found ${existingCustomOrders.length} existing custom orders for PaymentIntent ${paymentIntent.id}`,
      );

      const customOrdersToUpdate = existingCustomOrders.filter(
        (order) => order.status === "pending",
      );
      if (customOrdersToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("custom_orders")
          .update({
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("payment_intent_id", paymentIntent.id)
          .eq("status", "pending");

        if (updateError) {
          console.error(
            `Error updating custom orders for ${paymentIntent.id}:`,
            updateError,
          );
          throw new Error(
            `Failed to update custom orders: ${updateError.message}`,
          );
        }
        console.log(
          `Updated ${customOrdersToUpdate.length} custom orders to processing status`,
        );
      }
    }

    // Note: Purchase receipts are now handled automatically by Stripe
    // Configure in Stripe Dashboard: Settings > Emails > "Successful payments"

    // If no orders exist, this might be expected (order created via verify-and-create endpoint)
    if (
      (!existingOrders || existingOrders.length === 0) &&
      (!existingCustomOrders || existingCustomOrders.length === 0)
    ) {
      console.warn(
        `PaymentIntent succeeded but no orders found: ${paymentIntent.id}`,
      );
      console.warn(
        "This might be normal if orders are created via the verify-and-create endpoint",
      );

      // Log metadata for debugging
      if (
        paymentIntent.metadata &&
        Object.keys(paymentIntent.metadata).length > 0
      ) {
        console.log(
          "PaymentIntent metadata:",
          JSON.stringify(paymentIntent.metadata, null, 2),
        );
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `PaymentIntent ${paymentIntent.id} success handler completed in ${processingTime}ms`,
    );
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(
      `Error handling payment success for ${paymentIntent.id} (took ${processingTime}ms):`,
      {
        error: error.message,
        stack: error.stack,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
      },
    );
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const startTime = Date.now();
  console.log(
    `[${new Date().toISOString()}] Processing PaymentIntent failed: ${paymentIntent.id} (Amount: $${(paymentIntent.amount / 100).toFixed(2)})`,
  );

  try {
    // Update any existing orders to failed status
    const { error: orderError, count: orderCount } = await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", paymentIntent.id);

    if (orderError) {
      console.error(
        `Error updating failed order status for ${paymentIntent.id}:`,
        orderError,
      );
      throw new Error(`Failed to update orders: ${orderError.message}`);
    }

    if (orderCount && orderCount > 0) {
      console.log(
        `Updated ${orderCount} orders to failed status for PaymentIntent ${paymentIntent.id}`,
      );
    }

    // Update any existing custom orders to failed status
    const { error: customOrderError, count: customOrderCount } = await supabase
      .from("custom_orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntent.id);

    if (customOrderError) {
      console.error(
        `Error updating failed custom order status for ${paymentIntent.id}:`,
        customOrderError,
      );
      throw new Error(
        `Failed to update custom orders: ${customOrderError.message}`,
      );
    }

    if (customOrderCount && customOrderCount > 0) {
      console.log(
        `Updated ${customOrderCount} custom orders to cancelled status for PaymentIntent ${paymentIntent.id}`,
      );
    }

    // Log failure reason if available
    if (paymentIntent.last_payment_error) {
      console.log(`Payment failure reason for ${paymentIntent.id}:`, {
        code: paymentIntent.last_payment_error.code,
        message: paymentIntent.last_payment_error.message,
        type: paymentIntent.last_payment_error.type,
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `PaymentIntent ${paymentIntent.id} failure handler completed in ${processingTime}ms`,
    );
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(
      `Error handling payment failure for ${paymentIntent.id} (took ${processingTime}ms):`,
      {
        error: error.message,
        stack: error.stack,
        paymentIntentId: paymentIntent.id,
      },
    );
    throw error;
  }
}

async function handlePaymentIntentProcessing(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(
    `[${new Date().toISOString()}] Processing PaymentIntent processing status: ${paymentIntent.id}`,
  );

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
      console.error(
        `Error updating processing order status for ${paymentIntent.id}:`,
        orderError,
      );
      throw new Error(`Failed to update orders: ${orderError.message}`);
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
        `Error updating processing custom order status for ${paymentIntent.id}:`,
        customOrderError,
      );
      throw new Error(
        `Failed to update custom orders: ${customOrderError.message}`,
      );
    }

    console.log(
      `PaymentIntent ${paymentIntent.id} processing status updated successfully`,
    );
  } catch (error: any) {
    console.error(
      `Error handling payment processing for ${paymentIntent.id}:`,
      {
        error: error.message,
        stack: error.stack,
      },
    );
    throw error;
  }
}

async function handlePaymentIntentRequiresAction(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(
    `[${new Date().toISOString()}] Processing PaymentIntent requires action: ${paymentIntent.id}`,
  );

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
      console.error(
        `Error updating requires_action order status for ${paymentIntent.id}:`,
        orderError,
      );
      throw new Error(`Failed to update orders: ${orderError.message}`);
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
        `Error updating requires_action custom order status for ${paymentIntent.id}:`,
        customOrderError,
      );
      throw new Error(
        `Failed to update custom orders: ${customOrderError.message}`,
      );
    }

    console.log(
      `PaymentIntent ${paymentIntent.id} requires_action status updated successfully`,
    );
  } catch (error: any) {
    console.error(
      `Error handling payment requires action for ${paymentIntent.id}:`,
      {
        error: error.message,
        stack: error.stack,
      },
    );
    throw error;
  }
}

async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
) {
  console.log(
    `[${new Date().toISOString()}] Processing PaymentIntent canceled: ${paymentIntent.id}`,
  );

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
      console.error(
        `Error updating canceled order status for ${paymentIntent.id}:`,
        orderError,
      );
      throw new Error(`Failed to update orders: ${orderError.message}`);
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
        `Error updating canceled custom order status for ${paymentIntent.id}:`,
        customOrderError,
      );
      throw new Error(
        `Failed to update custom orders: ${customOrderError.message}`,
      );
    }

    console.log(
      `PaymentIntent ${paymentIntent.id} cancellation status updated successfully`,
    );
  } catch (error: any) {
    console.error(
      `Error handling payment cancellation for ${paymentIntent.id}:`,
      {
        error: error.message,
        stack: error.stack,
      },
    );
    throw error;
  }
}

// Function to send purchase receipt emails
async function sendPurchaseReceiptEmails(
  paymentIntent: Stripe.PaymentIntent,
  orders: any[] | null,
  customOrders: any[] | null,
) {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Sending purchase receipt emails for PaymentIntent ${paymentIntent.id}`);

  try {
    // Validate SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP not configured - skipping purchase receipt emails");
      return;
    }

    const emailsSent = [];

    // Send emails for regular orders
    if (orders && orders.length > 0) {
      for (const order of orders) {
        try {
          // Fetch full order details with items
          const { data: fullOrder, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", order.id)
            .single();

          if (orderError || !fullOrder) {
            console.error(`Failed to fetch order details for ${order.id}:`, orderError);
            continue;
          }

          if (!fullOrder.customer_email) {
            console.warn(`No customer email found for order ${order.id}`);
            continue;
          }

          // Prepare order items for email
          const orderItems = (fullOrder.items || []).map((item: any) => ({
            name: item.service_name || item.name || 'Service',
            quantity: item.quantity || 1,
            price: parseFloat(item.price || 0),
            total: parseFloat(item.price || 0) * (item.quantity || 1),
          }));

          const emailData = {
            customerEmail: fullOrder.customer_email,
            customerName: fullOrder.customer_name || 'Customer',
            orderNumber: fullOrder.id,
            orderDate: fullOrder.created_at || new Date().toISOString(),
            orderTotal: parseFloat(fullOrder.total_amount || 0),
            items: orderItems,
            paymentId: paymentIntent.id,
            isCustomOrder: false,
          };

          await sendOrderConfirmationEmailDirect(emailData);
          emailsSent.push(`order-${order.id}`);
          console.log(`Purchase receipt sent for order ${order.id} to ${fullOrder.customer_email}`);
        } catch (orderEmailError: any) {
          console.error(`Failed to send email for order ${order.id}:`, orderEmailError);
        }
      }
    }

    // Send emails for custom orders
    if (customOrders && customOrders.length > 0) {
      for (const customOrder of customOrders) {
        try {
          // Fetch full custom order details
          const { data: fullCustomOrder, error: customOrderError } = await supabase
            .from("custom_orders")
            .select("*")
            .eq("id", customOrder.id)
            .single();

          if (customOrderError || !fullCustomOrder) {
            console.error(`Failed to fetch custom order details for ${customOrder.id}:`, customOrderError);
            continue;
          }

          if (!fullCustomOrder.customer_email) {
            console.warn(`No customer email found for custom order ${customOrder.id}`);
            continue;
          }

          // Prepare custom order items for email
          const customOrderItems = (fullCustomOrder.items || []).map((item: any) => ({
            name: item.item_name || item.name || 'Custom Item',
            quantity: item.quantity || 1,
            price: parseFloat(item.price_per_unit || 0),
            total: parseFloat(item.total_price || 0),
          }));

          const emailData = {
            customerEmail: fullCustomOrder.customer_email,
            customerName: fullCustomOrder.customer_name || 'Customer',
            orderNumber: fullCustomOrder.id,
            orderDate: fullCustomOrder.created_at || new Date().toISOString(),
            orderTotal: parseFloat(fullCustomOrder.total_amount || 0),
            items: customOrderItems,
            paymentId: paymentIntent.id,
            isCustomOrder: true,
          };

          await sendOrderConfirmationEmailDirect(emailData);
          emailsSent.push(`custom-order-${customOrder.id}`);
          console.log(`Purchase receipt sent for custom order ${customOrder.id} to ${fullCustomOrder.customer_email}`);
        } catch (customOrderEmailError: any) {
          console.error(`Failed to send email for custom order ${customOrder.id}:`, customOrderEmailError);
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`Purchase receipt emails processing completed in ${processingTime}ms. Emails sent: ${emailsSent.length}`);

    if (emailsSent.length > 0) {
      console.log(`Successfully sent emails for: ${emailsSent.join(', ')}`);
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`Error in sendPurchaseReceiptEmails (took ${processingTime}ms):`, {
      error: error.message,
      stack: error.stack,
      paymentIntentId: paymentIntent.id,
    });
    throw error;
  }
}

// Direct email sending function (bypasses API to avoid circular calls)
async function sendOrderConfirmationEmailDirect(emailData: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  orderTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  paymentId?: string;
  isCustomOrder?: boolean;
}) {
  // Create SMTP transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: false,
    logger: false,
  });

  // Generate HTML email content
  const htmlContent = generateOrderConfirmationHTML(emailData);

  // Email options
  const fromName = process.env.SMTP_FROM_NAME || "HellDivers 2 Boosting";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: emailData.customerEmail,
    subject: `Order Confirmation - ${emailData.orderNumber}`,
    html: htmlContent,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  return info;
}

// HTML email template function (duplicated from send-order-confirmation.ts to avoid dependencies)
function generateOrderConfirmationHTML(data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  orderTotal: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  paymentId?: string;
  isCustomOrder?: boolean;
}): string {
  const {
    customerName,
    orderNumber,
    orderDate,
    orderTotal,
    items,
    paymentId,
    isCustomOrder,
  } = data;

  const itemsHTML = items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0; color: #374151;">${item.name}</td>
      <td style="padding: 12px 0; text-align: center; color: #6b7280;">${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right; color: #374151;">$${item.price.toFixed(2)}</td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">$${item.total.toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">HellDivers 2 Boosting</h1>
          <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">Order Confirmation</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 24px; text-align: center; background-color: #f0fdf4; border-bottom: 1px solid #e5e7eb;">
          <div style="display: inline-block; background-color: #22c55e; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 16px;">✓</div>
          <h2 style="margin: 0 0 8px; color: #16a34a; font-size: 24px;">Order Confirmed!</h2>
          <p style="margin: 0; color: #15803d; font-size: 16px;">Thank you for your purchase, ${customerName || "Valued Customer"}!</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 24px;">
          <h3 style="margin: 0 0 16px; color: #111827; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Order Details</h3>

          <div style="margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order Number:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order Date:</td>
                <td style="padding: 8px 0; color: #111827; text-align: right;">${new Date(
                  orderDate,
                ).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order Type:</td>
                <td style="padding: 8px 0; color: #111827; text-align: right;">${isCustomOrder ? "Custom Order" : "Standard Order"}</td>
              </tr>
              ${
                paymentId
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Payment ID:</td>
                <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 14px; text-align: right;">${paymentId}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>

          <!-- Order Items -->
          <h4 style="margin: 0 0 16px; color: #111827; font-size: 18px;">Items Ordered</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px 0; text-align: left; color: #374151; font-weight: 600;">Item</th>
                <th style="padding: 12px 0; text-align: center; color: #374151; font-weight: 600;">Qty</th>
                <th style="padding: 12px 0; text-align: right; color: #374151; font-weight: 600;">Price</th>
                <th style="padding: 12px 0; text-align: right; color: #374151; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #e5e7eb; background-color: #f9fafb;">
                <td colspan="3" style="padding: 16px 0; text-align: right; font-weight: 600; color: #111827; font-size: 18px;">Total:</td>
                <td style="padding: 16px 0; text-align: right; font-weight: bold; color: #111827; font-size: 18px;">$${orderTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Next Steps -->
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-top: 24px;">
            <h4 style="margin: 0 0 12px; color: #0369a1; font-size: 16px;">What happens next?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
              <li style="margin-bottom: 8px;">Our team will review your order details</li>
              <li style="margin-bottom: 8px;">A skilled booster will be assigned to your order</li>
              <li style="margin-bottom: 8px;">You'll receive updates on your order progress</li>
              <li>Your boost will be completed with high quality results</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
            Questions about your order? Contact us at
            <a href="mailto:${process.env.SMTP_FROM_EMAIL || 'support@helldivers-boost.com'}" style="color: #2563eb; text-decoration: none;">${process.env.SMTP_FROM_EMAIL || 'support@helldivers-boost.com'}</a>
          </p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} HellDivers 2 Boosting. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

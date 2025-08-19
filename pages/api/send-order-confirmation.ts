import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface EmailData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  orderTotal: number;
  items: OrderItem[];
  paymentId?: string;
  isCustomOrder?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const emailData: EmailData = req.body;

    // Debug log environment variables (without showing password)
    console.log("SMTP Configuration:", {
      host: process.env.SMTP_HOST || "NOT SET",
      port: process.env.SMTP_PORT || "NOT SET",
      user: process.env.SMTP_USER || "NOT SET",
      from: process.env.EMAIL_FROM || "NOT SET",
      fromName: process.env.EMAIL_FROM_NAME || "NOT SET",
      hasPassword: !!process.env.SMTP_PASS
    });

    // Validate required fields
    if (
      !emailData.customerEmail ||
      !emailData.orderNumber ||
      !emailData.items
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "customerEmail, orderNumber, and items are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailData.customerEmail || !emailRegex.test(emailData.customerEmail)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: `Email '${emailData.customerEmail}' is not valid`,
      });
    }

    // Validate environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("Missing SMTP environment variables");
      return res.status(500).json({
        error: "Server configuration error",
        details: "SMTP settings are not properly configured",
      });
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Generate HTML email content
    const htmlContent = generateOrderConfirmationHTML(emailData);

    // Email options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: emailData.customerEmail,
      subject: `Order Confirmation - ${emailData.orderNumber}`,
      html: htmlContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Order confirmation email sent successfully",
      sentTo: emailData.customerEmail,
    });
  } catch (error: any) {
    console.error("Email sending error:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
}

function generateOrderConfirmationHTML(data: EmailData): string {
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
            <a href="mailto:support@helldivers-boost.com" style="color: #2563eb; text-decoration: none;">support@helldivers-boost.com</a>
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

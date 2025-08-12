import { RequestHandler } from "express";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create a JSDOM instance for server-side DOMPurify
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

interface SendEmailRequest {
  to: string;
  subject: string;
  message: string;
  ticketId: string;
  customerName: string;
}

// Sanitize and validate email input
function sanitizeEmailInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  return purify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const handleSendEmail: RequestHandler = async (req, res) => {
  try {
    const { to, subject, message, ticketId, customerName }: SendEmailRequest =
      req.body;

    // Validate required fields
    if (!to || !subject || !message || !ticketId) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, message, ticketId",
      });
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Sanitize all input fields to prevent XSS
    const sanitizedTo = sanitizeEmailInput(to);
    const sanitizedSubject = sanitizeEmailInput(subject);
    const sanitizedMessage = sanitizeEmailInput(message);
    const sanitizedTicketId = sanitizeEmailInput(ticketId);
    const sanitizedCustomerName = sanitizeEmailInput(customerName);

    // For now, we'll log the email content and return success
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Nodemailer with SMTP

    console.log("📧 Sending support ticket reply email:");
    console.log(`To: ${sanitizedTo}`);
    console.log(`Subject: ${sanitizedSubject}`);
    console.log(`Ticket ID: ${sanitizedTicketId}`);
    console.log(`Message: ${sanitizedMessage}`);

    // Simulate email sending
    const emailContent = {
      to: sanitizedTo,
      from: "support@helldivers-boost.com",
      subject: sanitizedSubject.includes("Ticket")
        ? `Re: Support Ticket #${sanitizedTicketId.slice(-6)} - ${sanitizedSubject.replace("Support:", "").trim()}`
        : `Re: Order Update #${sanitizedTicketId.slice(-6)} - ${sanitizedSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">⚡ HelldiversBoost</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">
              ${sanitizedSubject.includes("Support") ? "Support Team Response" : "Order Update"}
            </p>
          </div>

          <div style="padding: 25px; background: #ffffff;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Hi ${sanitizedCustomerName}! 👋</h2>

            <p style="color: #374151; line-height: 1.6;">
              ${
                sanitizedSubject.includes("Support")
                  ? "Thank you for contacting our support team. Here's our response to your inquiry:"
                  : "We have an update regarding your order:"
              }
            </p>

            <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin: 25px 0; border-radius: 4px;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                <strong>${sanitizedSubject.includes("Support") ? "🎫 Ticket" : "📦 Order"} #${sanitizedTicketId.slice(-6)}</strong>
                ${sanitizedSubject.includes("Support") ? "" : ` | ${sanitizedSubject}`}
              </div>
              <div style="color: #111827; white-space: pre-wrap; line-height: 1.6;">${sanitizedMessage}</div>
            </div>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                💡 <strong>Need more help?</strong> Reply to this email or visit our support portal for faster assistance.
              </p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>The HelldiversBoost Team</strong> 🚀<br>
                <span style="font-size: 12px;">Boosting Helldivers to Glory</span>
              </p>
            </div>
          </div>

          <div style="background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 5px 0;">📧 This email was sent from the HelldiversBoost Admin Panel</p>
            <p style="margin: 0;">🕒 Sent on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    };

    // TODO: Replace this with actual email service integration
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(emailContent);
    */

    // Example with Nodemailer:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    await transporter.sendMail(emailContent);
    */

    // For now, just return success
    res.json({
      success: true,
      message: "Email sent successfully",
      emailData: {
        to: emailContent.to,
        subject: emailContent.subject,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    });
  }
};

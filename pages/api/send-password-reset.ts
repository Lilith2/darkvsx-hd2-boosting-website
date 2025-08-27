import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

interface PasswordResetEmailData {
  customerEmail: string;
  customerName?: string;
  resetUrl: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const emailData: PasswordResetEmailData = req.body;

    // Validate environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("Missing SMTP environment variables");
      return res.status(500).json({
        error: "Server configuration error",
        details: "SMTP settings are not properly configured",
      });
    }

    // Validate required fields
    if (!emailData.customerEmail || !emailData.resetUrl) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "customerEmail and resetUrl are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.customerEmail)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: `Email '${emailData.customerEmail}' is not valid`,
      });
    }

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
    const htmlContent = generatePasswordResetHTML(emailData);

    // Email options
    const fromName = process.env.SMTP_FROM_NAME || "HellDivers 2 Boosting";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: emailData.customerEmail,
      subject: "Password Reset Request - HellDivers 2 Boosting",
      html: htmlContent,
    };

    // Test connection first
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      console.error("SMTP connection verification failed:", verifyError);
      return res.status(500).json({
        error: "SMTP connection failed",
        details: verifyError.message,
      });
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
      sentTo: emailData.customerEmail,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("Password reset email sending error:", error);

    let errorDetails = error.message;
    if (error.code) {
      errorDetails = `${error.code}: ${error.message}`;
    }
    if (error.response) {
      errorDetails += ` (Response: ${error.response})`;
    }

    res.status(500).json({
      error: "Failed to send password reset email",
      details: errorDetails,
      code: error.code || "UNKNOWN_ERROR",
    });
  }
}

function generatePasswordResetHTML(data: PasswordResetEmailData): string {
  const { customerName, customerEmail, resetUrl } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - HellDivers 2 Boosting</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">HellDivers 2 Boosting</h1>
          <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">Password Reset Request</p>
        </div>

        <!-- Alert Message -->
        <div style="padding: 24px; text-align: center; background-color: #fef2f2; border-bottom: 1px solid #fecaca;">
          <div style="display: inline-block; background-color: #dc2626; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 16px;">🔒</div>
          <h2 style="margin: 0 0 8px; color: #dc2626; font-size: 24px;">Password Reset Request</h2>
          <p style="margin: 0; color: #991b1b; font-size: 16px;">
            ${customerName ? `Hello ${customerName}` : 'Hello'}, someone requested a password reset for your account.
          </p>
        </div>

        <!-- Reset Instructions -->
        <div style="padding: 32px 24px;">
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px; color: #0369a1; font-size: 18px;">Reset Your Password</h3>
            <p style="margin: 0 0 20px; color: #0c4a6e; font-size: 16px; line-height: 1.6;">
              To reset your password, click the button below. This link will expire in 1 hour for security reasons.
            </p>
            <div style="text-align: center;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
          </div>

          <!-- Security Notice -->
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 12px; color: #d97706; font-size: 16px;">🛡️ Security Notice</h4>
            <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
              <li style="margin-bottom: 8px;">This reset link will expire in 1 hour</li>
              <li style="margin-bottom: 8px;">The link can only be used once</li>
              <li style="margin-bottom: 8px;">If you didn't request this reset, you can safely ignore this email</li>
              <li>Your current password remains unchanged until you complete the reset</li>
            </ul>
          </div>

          <!-- Alternative Action -->
          <div style="text-align: center; padding: 20px; border: 2px dashed #d1d5db; border-radius: 8px;">
            <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; color: #374151;">
              ${resetUrl}
            </div>
          </div>
        </div>

        <!-- Help Section -->
        <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center;">
            <h4 style="margin: 0 0 16px; color: #374151; font-size: 16px;">Need Help?</h4>
            <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
              If you're having trouble resetting your password or didn't request this change, please contact our support team.
            </p>
            <a href="mailto:${process.env.SMTP_FROM_EMAIL || 'support@helldivers-boost.com'}" 
               style="color: #2563eb; text-decoration: none; font-weight: 600;">
              Contact Support
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #111827; color: white; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px; color: #d1d5db; font-size: 14px;">
            This email was sent to: <strong>${customerEmail}</strong>
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

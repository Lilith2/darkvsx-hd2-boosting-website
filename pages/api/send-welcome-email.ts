import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

interface WelcomeEmailData {
  customerEmail: string;
  customerName?: string;
  confirmationUrl?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const emailData: WelcomeEmailData = req.body;

    // Validate environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("Missing SMTP environment variables");
      return res.status(500).json({
        error: "Server configuration error",
        details: "SMTP settings are not properly configured",
      });
    }

    // Validate required fields
    if (!emailData.customerEmail) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "customerEmail is required",
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
    const htmlContent = generateWelcomeHTML(emailData);

    // Email options
    const fromName = process.env.SMTP_FROM_NAME || "HellDivers 2 Boosting";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: emailData.customerEmail,
      subject: "Welcome to HellDivers 2 Boosting - Confirm Your Email",
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
      message: "Welcome email sent successfully",
      sentTo: emailData.customerEmail,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("Welcome email sending error:", error);

    let errorDetails = error.message;
    if (error.code) {
      errorDetails = `${error.code}: ${error.message}`;
    }
    if (error.response) {
      errorDetails += ` (Response: ${error.response})`;
    }

    res.status(500).json({
      error: "Failed to send welcome email",
      details: errorDetails,
      code: error.code || "UNKNOWN_ERROR",
    });
  }
}

function generateWelcomeHTML(data: WelcomeEmailData): string {
  const { customerName, customerEmail, confirmationUrl } = data;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to HellDivers 2 Boosting</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">HellDivers 2 Boosting</h1>
          <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">Welcome to the Elite Helldivers Community</p>
        </div>

        <!-- Welcome Message -->
        <div style="padding: 32px 24px; text-align: center;">
          <div style="display: inline-block; background-color: #22c55e; color: white; width: 64px; height: 64px; border-radius: 50%; line-height: 64px; font-size: 32px; margin-bottom: 24px;">🎮</div>
          <h2 style="margin: 0 0 16px; color: #111827; font-size: 32px;">Welcome ${customerName ? customerName : "Helldiver"}!</h2>
          <p style="margin: 0 0 24px; color: #6b7280; font-size: 18px; line-height: 1.6;">
            Thank you for joining HellDivers 2 Boosting! You're now part of an elite community dedicated to spreading managed democracy across the galaxy.
          </p>
          
          ${confirmationUrl ? `
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px; color: #d97706; font-size: 18px;">Please Confirm Your Email</h3>
            <p style="margin: 0 0 16px; color: #92400e; font-size: 14px;">
              To complete your registration and start using all features, please confirm your email address.
            </p>
            <a href="${confirmationUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Confirm Email Address
            </a>
          </div>
          ` : ''}

          <!-- What's Next -->
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 24px; text-align: left;">
            <h3 style="margin: 0 0 16px; color: #0369a1; font-size: 20px; text-align: center;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 16px;">
              <li style="margin-bottom: 12px;">Browse our premium boosting services</li>
              <li style="margin-bottom: 12px;">Create custom orders tailored to your needs</li>
              <li style="margin-bottom: 12px;">Track your progress with our advanced monitoring</li>
              <li style="margin-bottom: 12px;">Join our Discord community for updates and support</li>
              <li>Experience professional, fast, and secure boosting</li>
            </ul>
          </div>
        </div>

        <!-- Services Preview -->
        <div style="background-color: #f9fafb; padding: 32px 24px;">
          <h3 style="margin: 0 0 24px; color: #111827; font-size: 24px; text-align: center;">Our Premium Services</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 8px; color: #1f2937; font-size: 16px;">⚡ Level Boosting</h4>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Fast progression from 1-50</p>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 8px; color: #1f2937; font-size: 16px;">🏅 Medal Farming</h4>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Unlock exclusive rewards</p>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 8px; color: #1f2937; font-size: 16px;">🔬 Sample Collection</h4>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Gather rare materials</p>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h4 style="margin: 0 0 8px; color: #1f2937; font-size: 16px;">💰 Super Credits</h4>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Earn premium currency</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #111827; color: white; padding: 32px 24px; text-align: center;">
          <h3 style="margin: 0 0 16px; font-size: 20px;">Ready to Start?</h3>
          <p style="margin: 0 0 24px; color: #d1d5db; font-size: 16px;">
            Visit our website to explore services and place your first order
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://helldivers-boost.com'}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
            Browse Services
          </a>
          
          <div style="border-top: 1px solid #374151; padding-top: 24px; margin-top: 24px;">
            <p style="margin: 0 0 8px; color: #9ca3af; font-size: 14px;">
              Questions? Contact us at 
              <a href="mailto:${process.env.SMTP_FROM_EMAIL || 'support@helldivers-boost.com'}" 
                 style="color: #60a5fa; text-decoration: none;">${process.env.SMTP_FROM_EMAIL || 'support@helldivers-boost.com'}</a>
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              © ${new Date().getFullYear()} HellDivers 2 Boosting. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}

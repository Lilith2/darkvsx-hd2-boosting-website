import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
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

    // Validate environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("Missing SMTP environment variables");
      return res.status(500).json({
        error: "Server configuration error",
        details: "SMTP settings are not properly configured",
      });
    }

    // Validate required fields
    if (!emailData.to || !emailData.subject || (!emailData.html && !emailData.text)) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "to, subject, and html or text are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: `Email '${emailData.to}' is not valid`,
      });
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: false,
      logger: false,
    });

    // Prepare email options
    const fromName = process.env.SMTP_FROM_NAME || "HellDivers 2 Boosting";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: emailData.from || `"${fromName}" <${fromEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      ...(emailData.html && { html: emailData.html }),
      ...(emailData.text && { text: emailData.text }),
      ...(emailData.replyTo && { replyTo: emailData.replyTo }),
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
      message: "Email sent successfully",
      sentTo: emailData.to,
      messageId: info.messageId,
      emailData: {
        to: emailData.to,
        subject: emailData.subject,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Email sending error:", error);

    // More detailed error reporting
    let errorDetails = error.message;
    if (error.code) {
      errorDetails = `${error.code}: ${error.message}`;
    }
    if (error.response) {
      errorDetails += ` (Response: ${error.response})`;
    }

    res.status(500).json({
      error: "Failed to send email",
      details: errorDetails,
      code: error.code || "UNKNOWN_ERROR",
    });
  }
}

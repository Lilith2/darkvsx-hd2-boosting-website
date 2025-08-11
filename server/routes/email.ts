import { RequestHandler } from "express";

interface SendEmailRequest {
  to: string;
  subject: string;
  message: string;
  ticketId: string;
  customerName: string;
}

export const handleSendEmail: RequestHandler = async (req, res) => {
  try {
    const { to, subject, message, ticketId, customerName }: SendEmailRequest = req.body;

    // Validate required fields
    if (!to || !subject || !message || !ticketId) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, message, ticketId"
      });
    }

    // For now, we'll log the email content and return success
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Nodemailer with SMTP
    
    console.log("📧 Sending support ticket reply email:");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Ticket ID: ${ticketId}`);
    console.log(`Message: ${message}`);
    
    // Simulate email sending
    const emailContent = {
      to,
      from: "support@helldivers-boost.com",
      subject: `Re: Support Ticket #${ticketId.slice(-6)} - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">HelldiversBoost Support</h1>
            <p style="margin: 5px 0 0 0;">Response to your support request</p>
          </div>
          
          <div style="padding: 20px; background: #f8fafc;">
            <h2 style="color: #1e3a8a;">Hi ${customerName},</h2>
            
            <p>We've received your support request and here's our response:</p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <strong>Ticket #${ticketId.slice(-6)}</strong>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p>If you have any additional questions or need further assistance, please reply to this email or contact us through our support system.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                Best regards,<br>
                The HelldiversBoost Support Team
              </p>
            </div>
          </div>
          
          <div style="background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; font-size: 12px;">
            <p>This is an automated response from HelldiversBoost Support System</p>
            <p>Please do not reply directly to this email</p>
          </div>
        </div>
      `
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
        sentAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error.message
    });
  }
};

import { NextApiRequest, NextApiResponse } from "next";
import { sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail } from "@/lib/emailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { emailType, testEmail, testName } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "testEmail is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: `Email '${testEmail}' is not valid`,
      });
    }

    const results = [];

    if (!emailType || emailType === "welcome") {
      try {
        const welcomeResult = await sendWelcomeEmail({
          customerEmail: testEmail,
          customerName: testName || "Test User",
          confirmationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/email-confirmation?email=${encodeURIComponent(testEmail)}&type=signup&token=test123`,
        });
        results.push({ type: "welcome", success: true, result: welcomeResult });
      } catch (error: any) {
        results.push({ type: "welcome", success: false, error: error.message });
      }
    }

    if (!emailType || emailType === "password-reset") {
      try {
        const resetResult = await sendPasswordResetEmail({
          customerEmail: testEmail,
          customerName: testName || "Test User",
          resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=test123`,
        });
        results.push({ type: "password-reset", success: true, result: resetResult });
      } catch (error: any) {
        results.push({ type: "password-reset", success: false, error: error.message });
      }
    }

    if (!emailType || emailType === "order-confirmation") {
      try {
        const orderResult = await sendOrderConfirmationEmail({
          customerEmail: testEmail,
          customerName: testName || "Test User",
          orderNumber: "TEST-001",
          orderDate: new Date().toISOString(),
          orderTotal: 25.99,
          items: [
            {
              name: "Level Boost (1-50)",
              quantity: 1,
              price: 20.00,
              total: 20.00,
            },
            {
              name: "Super Credits (1000)",
              quantity: 1,
              price: 5.99,
              total: 5.99,
            },
          ],
          paymentId: "pi_test123456789",
          isCustomOrder: false,
        });
        results.push({ type: "order-confirmation", success: true, result: orderResult });
      } catch (error: any) {
        results.push({ type: "order-confirmation", success: false, error: error.message });
      }
    }

    const successfulTests = results.filter(r => r.success).length;
    const totalTests = results.length;

    res.status(200).json({
      success: true,
      message: `Email tests completed: ${successfulTests}/${totalTests} successful`,
      results: results,
      testEmail: testEmail,
      testName: testName || "Test User",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Email testing error:", error);

    res.status(500).json({
      error: "Failed to test emails",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

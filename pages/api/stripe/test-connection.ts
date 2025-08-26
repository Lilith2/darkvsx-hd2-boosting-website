import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Initialize Stripe according to official documentation
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-09-30.acacia",
  typescript: true,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Test the connection by creating a minimal payment intent (this requires valid API key)
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 in cents
      currency: "usd",
      payment_method_types: ["card"],
    });

    // Cancel the test payment intent immediately
    await stripe.paymentIntents.cancel(testPaymentIntent.id);

    return res.status(200).json({
      success: true,
      message: "Stripe connection successful",
      apiKeyStatus: "valid",
      testPaymentIntentId: testPaymentIntent.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Stripe connection test failed:", error);

    return res.status(500).json({
      success: false,
      message: "Stripe connection failed",
      error: error.message,
      type: error.type,
      timestamp: new Date().toISOString(),
    });
  }
}

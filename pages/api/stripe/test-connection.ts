import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Initialize Stripe helper
function getStripeInstance(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = getStripeInstance();
    
    // Test the connection by listing payment methods (this requires valid API key)
    const paymentMethods = await stripe.paymentMethods.list({
      limit: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Stripe connection successful",
      apiKeyStatus: "valid",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Stripe connection test failed:", error);
    
    return res.status(500).json({
      success: false,
      message: "Stripe connection failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

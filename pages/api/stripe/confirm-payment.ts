import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment intent ID required" });
    }

    // Retrieve the payment intent to verify it's successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      res.status(200).json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Payment not successful. Status: ${paymentIntent.status}`,
      });
    }
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    res.status(500).json({
      error: error.message || "Failed to confirm payment",
    });
  }
}

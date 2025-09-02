import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get available payment method types
    const paymentMethods = [
      {
        id: "card",
        name: "Credit/Debit Card",
        description: "Visa, Mastercard, American Express, JCB, UnionPay",
        icon: "credit-card",
        enabled: true,
      },
      {
        id: "google_pay",
        name: "Google Pay",
        description: "Pay with Google Pay",
        icon: "google",
        enabled: true,
      },
      {
        id: "apple_pay",
        name: "Apple Pay",
        description: "Pay with Apple Pay",
        icon: "apple",
        enabled: true,
      },
      {
        id: "amazon_pay",
        name: "Amazon Pay",
        description: "Pay with Amazon Pay",
        icon: "shopping-cart",
        enabled: true,
      },
      {
        id: "us_bank_account",
        name: "ACH Direct Debit",
        description: "Pay directly from your bank account",
        icon: "bank",
        enabled: true,
      },
      {
        id: "link",
        name: "Stripe Link",
        description: "Secure 1-click checkout",
        icon: "link",
        enabled: true,
      },
      {
        id: "cashapp",
        name: "Cash App Pay",
        description: "Pay with Cash App",
        icon: "smartphone",
        enabled: true,
      },
      {
        id: "venmo",
        name: "Venmo",
        description: "Pay with Venmo",
        icon: "smartphone",
        enabled: true,
      },
      {
        id: "klarna",
        name: "Klarna",
        description: "Buy now, pay later with Klarna",
        icon: "calendar",
        enabled: true,
      },
      {
        id: "affirm",
        name: "Affirm",
        description: "Pay over time with Affirm",
        icon: "calendar",
        enabled: true,
      },
    ];

    // Add custom payment method - this ID represents a custom payment method in your Stripe dashboard
    const customPaymentMethodId = "cpmt_1RybC7Gre37xKT2Zf7wCtFrS";

    // Note: Custom payment methods from dashboard may not be retrievable via API
    // Adding it to the list as it's configured in your Stripe dashboard
    paymentMethods.push({
      id: customPaymentMethodId,
      name: "Custom Payment",
      description: "Special payment method configured in dashboard",
      icon: "star",
      enabled: true,
    });

    res.status(200).json({ paymentMethods });
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch payment methods",
    });
  }
}

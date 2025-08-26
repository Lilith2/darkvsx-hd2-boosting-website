import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const hasStripeSecret = !!process.env.STRIPE_SECRET_KEY;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    return res.status(200).json({
      environment_check: {
        stripe_secret_key: hasStripeSecret,
        supabase_url: hasSupabaseUrl,
        supabase_service_key: hasSupabaseServiceKey,
        stripe_public_key: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        venmo_capability_removed: "Invalid configuration ID removed",
      },
      status: "Environment variables loaded successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Environment check failed",
      details: error.message,
    });
  }
}

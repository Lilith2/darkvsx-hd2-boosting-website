import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const validateRequestSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const parseResult = validateRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parseResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", "),
      });
    }

    const { serviceIds } = parseResult.data;

    if (serviceIds.length === 0) {
      return res.status(200).json({
        validServiceIds: [],
        invalidServiceIds: [],
      });
    }

    // Query database for both services and bundles
    const [servicesResult, bundlesResult] = await Promise.all([
      supabase.from("services").select("id, active").in("id", serviceIds),
      supabase.from("bundles").select("id, active").in("id", serviceIds),
    ]);

    if (servicesResult.error) {
      console.error("Error validating services:", servicesResult.error);
      return res.status(500).json({
        error: "Failed to validate services",
        details: "Database error occurred while checking services",
      });
    }

    if (bundlesResult.error) {
      console.error("Error validating bundles:", bundlesResult.error);
      return res.status(500).json({
        error: "Failed to validate bundles",
        details: "Database error occurred while checking bundles",
      });
    }

    const services = servicesResult.data || [];
    const bundles = bundlesResult.data || [];

    // Determine valid service IDs (active services)
    const validServices = services
      .filter((service) => service.active === true)
      .map((service) => service.id);

    // Determine valid bundle IDs (active bundles)
    const validBundles = bundles
      .filter((bundle) => bundle.active === true)
      .map((bundle) => bundle.id);

    // Combine valid IDs from both services and bundles
    const validServiceIds = [...validServices, ...validBundles];

    // Find all IDs that were found in either table
    const foundServiceIds = [
      ...services.map((s) => s.id),
      ...bundles.map((b) => b.id),
    ];

    // Invalid IDs are those not found anywhere or found but inactive
    const invalidServiceIds = serviceIds.filter((id) => {
      const serviceRecord = services.find((service) => service.id === id);
      const bundleRecord = bundles.find((bundle) => bundle.id === id);

      // If not found in either table, it's invalid
      if (!serviceRecord && !bundleRecord) return true;

      // If found but inactive, it's invalid
      if (serviceRecord && !serviceRecord.active) return true;
      if (bundleRecord && !bundleRecord.active) return true;

      return false;
    });

    console.log("Service and bundle validation results:", {
      requested: serviceIds.length,
      validServices: validServices.length,
      validBundles: validBundles.length,
      totalValid: validServiceIds.length,
      invalid: invalidServiceIds.length,
      breakdown: {
        services: services.length,
        bundles: bundles.length,
      },
    });

    return res.status(200).json({
      validServiceIds,
      invalidServiceIds,
      summary: {
        total: serviceIds.length,
        valid: validServiceIds.length,
        invalid: invalidServiceIds.length,
      },
    });
  } catch (error: any) {
    console.error("Error in service validation:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message || "An unexpected error occurred",
    });
  }
}

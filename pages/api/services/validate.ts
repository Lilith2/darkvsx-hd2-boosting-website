import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const validateRequestSchema = z.object({
  serviceIds: z.array(z.string()),
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

    // Filter out non-UUID IDs and keep track of them
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const uuidServiceIds = serviceIds.filter(id => uuidRegex.test(id));
    const nonUuidIds = serviceIds.filter(id => !uuidRegex.test(id));

    // Only query database if there are UUID IDs to check
    let services: any[] = [];
    let bundles: any[] = [];

    if (uuidServiceIds.length > 0) {
      const [servicesResult, bundlesResult] = await Promise.all([
        supabase.from("services").select("id, active").in("id", uuidServiceIds),
        supabase.from("bundles").select("id, active").in("id", uuidServiceIds),
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

      services = servicesResult.data || [];
      bundles = bundlesResult.data || [];
    }

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

    // Invalid IDs are UUID IDs that are not found or inactive
    const invalidUuidIds = uuidServiceIds.filter((id) => {
      const serviceRecord = services.find((service) => service.id === id);
      const bundleRecord = bundles.find((bundle) => bundle.id === id);

      // If not found in either table, it's invalid
      if (!serviceRecord && !bundleRecord) return true;

      // If found but inactive, it's invalid
      if (serviceRecord && !serviceRecord.active) return true;
      if (bundleRecord && !bundleRecord.active) return true;

      return false;
    });

    // Non-UUID IDs are considered invalid for database items but might be valid for special items
    // (like custom orders), so we'll mark them as invalid for database validation
    const invalidServiceIds = [...invalidUuidIds, ...nonUuidIds];

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

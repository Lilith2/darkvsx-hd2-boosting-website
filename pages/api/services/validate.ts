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

    // Query database for services
    const { data: services, error } = await supabase
      .from("services")
      .select("id, active")
      .in("id", serviceIds);

    if (error) {
      console.error("Error validating services:", error);
      return res.status(500).json({
        error: "Failed to validate services",
        details: "Database error occurred",
      });
    }

    // Determine valid and invalid service IDs
    const validServiceIds = services
      ?.filter(service => service.active === true)
      .map(service => service.id) || [];
    
    const foundServiceIds = services?.map(service => service.id) || [];
    const invalidServiceIds = serviceIds.filter(
      id => !foundServiceIds.includes(id) || 
           services?.find(service => service.id === id)?.active === false
    );

    console.log("Service validation results:", {
      requested: serviceIds.length,
      valid: validServiceIds.length,
      invalid: invalidServiceIds.length,
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

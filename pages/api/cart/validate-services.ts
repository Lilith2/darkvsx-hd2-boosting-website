import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const validateCartSchema = z.object({
  items: z.array(
    z.object({
      serviceId: z.string().uuid(),
      quantity: z.number().positive().int(),
    })
  ),
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
    const parseResult = validateCartSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parseResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", "),
      });
    }

    const { items } = parseResult.data;

    if (items.length === 0) {
      return res.status(200).json({
        valid: true,
        validItems: [],
        invalidItems: [],
        issues: [],
        totalValidItems: 0,
      });
    }

    const serviceIds = items.map((item) => item.serviceId);

    // Query database for both services and bundles to support unified cart
    const [servicesResult, bundlesResult] = await Promise.all([
      supabase
        .from("services")
        .select("id, title, price, active, category")
        .in("id", serviceIds),
      supabase
        .from("bundles")
        .select("id, name, discounted_price, active")
        .in("id", serviceIds),
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

    // Validate each cart item
    const validItems: any[] = [];
    const invalidItems: any[] = [];
    const issues: string[] = [];

    for (const item of items) {
      const serviceRecord = services.find((s) => s.id === item.serviceId);
      const bundleRecord = bundles.find((b) => b.id === item.serviceId);

      if (!serviceRecord && !bundleRecord) {
        invalidItems.push({
          ...item,
          reason: "Item not found in database",
          severity: "error",
        });
        issues.push(`Item ${item.serviceId} no longer exists`);
        continue;
      }

      // Check if service/bundle is active
      if (serviceRecord && !serviceRecord.active) {
        invalidItems.push({
          ...item,
          reason: "Service is inactive",
          severity: "warning",
          details: serviceRecord,
        });
        issues.push(`Service "${serviceRecord.title}" is no longer active`);
        continue;
      }

      if (bundleRecord && !bundleRecord.active) {
        invalidItems.push({
          ...item,
          reason: "Bundle is inactive",
          severity: "warning",
          details: bundleRecord,
        });
        issues.push(`Bundle "${bundleRecord.name}" is no longer active`);
        continue;
      }

      // Item is valid
      if (serviceRecord) {
        validItems.push({
          ...item,
          type: "service",
          details: {
            id: serviceRecord.id,
            title: serviceRecord.title,
            price: parseFloat(serviceRecord.price),
            category: serviceRecord.category,
          },
        });
      } else if (bundleRecord) {
        validItems.push({
          ...item,
          type: "bundle",
          details: {
            id: bundleRecord.id,
            title: bundleRecord.name,
            price: parseFloat(bundleRecord.discounted_price),
            category: "bundle",
          },
        });
      }
    }

    // Calculate totals for validation
    const cartTotal = validItems.reduce((sum, item) => {
      return sum + (item.details.price * item.quantity);
    }, 0);

    console.log("Cart validation results:", {
      totalItems: items.length,
      validItems: validItems.length,
      invalidItems: invalidItems.length,
      issues: issues.length,
      cartTotal: cartTotal.toFixed(2),
    });

    return res.status(200).json({
      valid: invalidItems.length === 0,
      validItems,
      invalidItems,
      issues,
      totalValidItems: validItems.length,
      summary: {
        totalItems: items.length,
        validItems: validItems.length,
        invalidItems: invalidItems.length,
        cartTotal: parseFloat(cartTotal.toFixed(2)),
        hasErrors: invalidItems.some(item => item.severity === "error"),
        hasWarnings: invalidItems.some(item => item.severity === "warning"),
      },
    });
  } catch (error: any) {
    console.error("Error in cart validation:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message || "An unexpected error occurred",
    });
  }
}

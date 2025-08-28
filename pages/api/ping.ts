import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

type Data = {
  message: string;
  timestamp: string;
  database?: {
    status: string;
    services: number;
    orders: number;
    customOrders: number;
    bundles: number;
    profiles: number;
    error?: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({
        message: "Method not allowed",
        timestamp: new Date().toISOString(),
      });
  }

  // Add caching headers - ping can be cached briefly
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
  res.setHeader("CDN-Cache-Control", "max-age=60");

  const response: Data = {
    message: process.env.PING_MESSAGE || "pong",
    timestamp: new Date().toISOString(),
  };

  // Include database status if requested
  if (req.query.db === "true") {
    try {
      const [servicesResult, ordersResult, customOrdersResult, bundlesResult, profilesResult] = await Promise.allSettled([
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("custom_orders").select("id", { count: "exact", head: true }),
        supabase.from("bundles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const getCount = (result: PromiseSettledResult<any>) => {
        if (result.status === "fulfilled" && !result.value.error) {
          return result.value.count || 0;
        }
        return -1; // Error indicator
      };

      response.database = {
        status: "connected",
        services: getCount(servicesResult),
        orders: getCount(ordersResult),
        customOrders: getCount(customOrdersResult),
        bundles: getCount(bundlesResult),
        profiles: getCount(profilesResult),
      };

      // Check if any table had errors
      const hasErrors = [servicesResult, ordersResult, customOrdersResult, bundlesResult, profilesResult]
        .some(result => result.status === "rejected" || (result.status === "fulfilled" && result.value.error));

      if (hasErrors) {
        response.database.status = "partial";
        response.database.error = "Some tables had connection issues";
      }

    } catch (error: any) {
      response.database = {
        status: "error",
        services: -1,
        orders: -1,
        customOrders: -1,
        bundles: -1,
        profiles: -1,
        error: error.message || "Database connection failed",
      };
    }
  }

  res.status(200).json(response);
}

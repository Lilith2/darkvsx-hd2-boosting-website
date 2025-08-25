import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/constants";

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Validation schema for request
const requestSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    customer_email: z.string().email().optional(),
  })
  .refine((data) => data.user_id || data.customer_email, {
    message: "Either user_id or customer_email must be provided",
  });

interface CompletedOrder {
  id: string;
  order_number?: string;
  customer_name: string;
  services: any[];
  total_amount: number;
  completed_at: string;
  created_at: string;
  order_type: "regular" | "custom";
  has_review: boolean;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  orders?: CompletedOrder[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Validate query parameters
    const parsed = requestSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${parsed.error.issues.map((i) => i.message).join(", ")}`,
      });
    }

    const { user_id, customer_email } = parsed.data;
    const completedOrders: CompletedOrder[] = [];

    // Fetch completed regular orders
    const regularOrdersQuery = supabase
      .from("orders")
      .select(
        "id, customer_name, services, total_amount, created_at, updated_at",
      )
      .eq("status", ORDER_STATUSES.COMPLETED);

    if (user_id) {
      regularOrdersQuery.eq("user_id", user_id);
    } else if (customer_email) {
      regularOrdersQuery.eq("customer_email", customer_email);
    }

    const { data: regularOrders, error: regularOrdersError } =
      await regularOrdersQuery;

    if (regularOrdersError && regularOrdersError.code !== "PGRST116") {
      console.error("Error fetching regular orders:", regularOrdersError);
      return res.status(500).json({
        success: false,
        error: "Database error while fetching orders",
      });
    }

    // Process regular orders
    if (regularOrders) {
      for (const order of regularOrders) {
        // Check if already has a review
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();

        completedOrders.push({
          id: order.id,
          customer_name: order.customer_name,
          services: Array.isArray(order.services) ? order.services : [],
          total_amount: order.total_amount,
          completed_at: order.updated_at || order.created_at,
          created_at: order.created_at,
          order_type: "regular",
          has_review: !!existingReview,
        });
      }
    }

    // Fetch completed custom orders
    const customOrdersQuery = supabase
      .from("custom_orders")
      .select(
        "id, order_number, customer_name, items, total_amount, created_at, completed_at",
      )
      .or(`status.eq.${ORDER_STATUSES.COMPLETED},completed_at.not.is.null`);

    if (user_id) {
      customOrdersQuery.eq("user_id", user_id);
    } else if (customer_email) {
      customOrdersQuery.eq("customer_email", customer_email);
    }

    const { data: customOrders, error: customOrdersError } =
      await customOrdersQuery;

    if (customOrdersError && customOrdersError.code !== "PGRST116") {
      console.error("Error fetching custom orders:", customOrdersError);
      return res.status(500).json({
        success: false,
        error: "Database error while fetching custom orders",
      });
    }

    // Process custom orders
    if (customOrders) {
      for (const order of customOrders) {
        // Check if already has a review
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("id")
          .eq("order_id", order.id)
          .maybeSingle();

        completedOrders.push({
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          services: Array.isArray(order.items) ? order.items : [],
          total_amount: order.total_amount,
          completed_at: order.completed_at || order.created_at,
          created_at: order.created_at,
          order_type: "custom",
          has_review: !!existingReview,
        });
      }
    }

    // Sort by completion date (most recent first)
    completedOrders.sort(
      (a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
    );

    return res.status(200).json({
      success: true,
      orders: completedOrders,
    });
  } catch (error: any) {
    console.error("Error fetching completed orders:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error. Please try again later.",
    });
  }
}

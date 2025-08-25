import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/constants";

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for review submission
const reviewSubmissionSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(2000),
  title: z.string().max(255).optional(),
  customer_name: z.string().min(1).max(255),
  customer_email: z.string().email().max(255),
  user_id: z.string().uuid().optional(),
  order_id: z.string().uuid(),
  service_name: z.string().max(255).optional(),
});

type ReviewSubmissionData = z.infer<typeof reviewSubmissionSchema>;

interface ApiResponse {
  success: boolean;
  error?: string;
  review?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }

  try {
    // Validate request body
    const parsed = reviewSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${parsed.error.issues.map(i => i.message).join(", ")}`,
      });
    }

    const reviewData = parsed.data;

    // 1. Find and validate the order
    const orderValidation = await validateOrder(reviewData);
    if (!orderValidation.success) {
      return res.status(orderValidation.statusCode).json({
        success: false,
        error: orderValidation.error,
      });
    }

    const { order, orderType } = orderValidation;

    // 2. Check if user has already reviewed this order
    const existingReview = await checkExistingReview(reviewData.order_id);
    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: "You have already submitted a review for this order",
      });
    }

    // 3. Create the review
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert([
        {
          customer_name: reviewData.customer_name,
          customer_email: reviewData.customer_email,
          user_id: reviewData.user_id || null,
          rating: reviewData.rating,
          title: reviewData.title || null,
          comment: reviewData.comment,
          order_id: reviewData.order_id,
          order_number: orderType === "custom" && "order_number" in order ? order.order_number : order.id,
          service_name: reviewData.service_name || null,
          status: "pending",
          verified: true, // Mark as verified since we validated the order
          featured: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting review:", insertError);
      return res.status(500).json({
        success: false,
        error: "Failed to save review. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error: any) {
    console.error("Error in review submission:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error. Please try again later.",
    });
  }
}

interface RegularOrder {
  id: string;
  user_id: string | null;
  customer_email: string;
  customer_name: string;
  status: string;
  services: any;
}

interface CustomOrder {
  id: string;
  user_id: string | null;
  customer_email: string;
  customer_name: string;
  status: string;
  order_number: string;
  completed_at: string | null;
}

interface ValidationSuccess {
  success: true;
  order: RegularOrder | CustomOrder;
  orderType: "regular" | "custom";
}

interface ValidationError {
  success: false;
  statusCode: number;
  error: string;
}

async function validateOrder(reviewData: ReviewSubmissionData) {
  const { order_id, user_id, customer_email } = reviewData;

  // First, try to find the order in the regular orders table
  const { data: regularOrder, error: regularOrderError } = await supabase
    .from("orders")
    .select("id, user_id, customer_email, customer_name, status, services")
    .eq("id", order_id)
    .maybeSingle();

  if (regularOrderError && regularOrderError.code !== "PGRST116") {
    console.error("Error fetching regular order:", regularOrderError);
    return {
      success: false,
      statusCode: 500,
      error: "Database error while validating order",
    };
  }

  let order: RegularOrder | CustomOrder | null = regularOrder;
  let orderType: "regular" | "custom" = "regular";

  // If not found in regular orders, try custom orders
  if (!order) {
    const { data: customOrder, error: customOrderError } = await supabase
      .from("custom_orders")
      .select("id, user_id, customer_email, customer_name, status, order_number, completed_at")
      .eq("id", order_id)
      .maybeSingle();

    if (customOrderError && customOrderError.code !== "PGRST116") {
      console.error("Error fetching custom order:", customOrderError);
      return {
        success: false,
        statusCode: 500,
        error: "Database error while validating order",
      };
    }

    order = customOrder;
    orderType = "custom";
  }

  // Check if order exists
  if (!order) {
    return {
      success: false,
      statusCode: 404,
      error: "Order not found. Please verify the order ID.",
    };
  }

  // Check if order is completed
  const isCompleted = orderType === "custom"
    ? (order.status === ORDER_STATUSES.COMPLETED || !!(order as CustomOrder).completed_at)
    : order.status === ORDER_STATUSES.COMPLETED;

  if (!isCompleted) {
    return {
      success: false,
      statusCode: 403,
      error: "Cannot review an incomplete order. Please wait until your order is completed.",
    };
  }

  // Verify ownership
  if (user_id) {
    // For authenticated users, check user_id match
    if (order.user_id !== user_id) {
      return {
        success: false,
        statusCode: 403,
        error: "You can only review orders that you placed.",
      };
    }
  } else {
    // For anonymous users, check email match
    if (order.customer_email !== customer_email) {
      return {
        success: false,
        statusCode: 403,
        error: "Email address does not match the order. Please use the email address used for the order.",
      };
    }
  }

  return {
    success: true,
    order,
    orderType,
  };
}

async function checkExistingReview(orderId: string) {
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  return existingReview;
}

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface PublicReview {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  comment: string;
  service_name: string | null;
  verified: boolean;
  featured: boolean;
  created_at: string;
  // Sensitive fields deliberately omitted:
  // - customer_email
  // - user_id  
  // - order_id
  // - order_number
}

interface ApiResponse {
  success: boolean;
  error?: string;
  reviews?: PublicReview[];
  total?: number;
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
    const { status = "approved", featured, limit = 100, rating } = req.query;

    let query = supabase
      .from("reviews")
      .select(`
        id,
        customer_name,
        rating,
        title,
        comment,
        service_name,
        verified,
        featured,
        created_at
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    // Apply optional filters
    if (featured !== undefined) {
      query = query.eq("featured", featured === "true");
    }

    if (rating) {
      query = query.eq("rating", parseInt(rating as string));
    }

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }

    const { data: reviews, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching public reviews:", fetchError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch reviews",
      });
    }

    // Extra sanitization to ensure no sensitive data leaks
    const sanitizedReviews: PublicReview[] = (reviews || []).map(review => ({
      id: review.id,
      customer_name: review.customer_name,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      service_name: review.service_name,
      verified: review.verified,
      featured: review.featured,
      created_at: review.created_at,
    }));

    return res.status(200).json({
      success: true,
      reviews: sanitizedReviews,
      total: sanitizedReviews.length,
    });
  } catch (error: any) {
    console.error("Error in public reviews API:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

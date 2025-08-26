import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client-no-realtime";

export interface Review {
  id: string;
  customer_name: string;
  customer_email: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  comment: string;
  order_id: string | null;
  order_number: string | null;
  service_name: string | null;
  status: string;
  verified: boolean;
  featured: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  featured_at: string | null;
}

interface UseReviewsResult {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseReviewsOptions {
  status?: "pending" | "approved" | "rejected";
  featured?: boolean;
  limit?: number;
  userId?: string;
}

export function useReviews(options: UseReviewsOptions = {}): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters based on options
      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.featured !== undefined) {
        query = query.eq("featured", options.featured);
      }

      if (options.userId) {
        query = query.eq("user_id", options.userId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // SECURITY: Sanitize reviews for public display
      const sanitizedReviews = (data || []).map((review) => {
        // If this is for public display (no userId filter), remove sensitive data
        if (!options.userId) {
          return {
            ...review,
            order_id: null, // Remove order ID from public reviews
            order_number: null, // Remove order number from public reviews
            customer_email: "***", // Hide email from public reviews
          };
        }
        return review;
      });

      setReviews(sanitizedReviews);
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
      setError(err.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [options.status, options.featured, options.limit, options.userId]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews,
  };
}

// Hook specifically for approved reviews (public display) - uses secure API
export function useApprovedReviews(limit?: number): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());

      const response = await fetch(`/api/reviews/public?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch reviews");
      }

      // Convert public reviews to Review format (with sanitized fields)
      const sanitizedReviews: Review[] = result.reviews.map((review: any) => ({
        ...review,
        customer_email: "***", // Hidden for security
        user_id: null, // Hidden for security
        order_id: null, // Hidden for security
        order_number: null, // Hidden for security
        status: "approved",
        metadata: {},
        updated_at: review.created_at,
        approved_at: review.created_at,
        featured_at: review.featured ? review.created_at : null,
      }));

      setReviews(sanitizedReviews);
    } catch (err: any) {
      console.error("Error fetching public reviews:", err);
      setError(err.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicReviews();
  }, [limit]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchPublicReviews,
  };
}

// Hook specifically for featured reviews
export function useFeaturedReviews(limit?: number): UseReviewsResult {
  return useReviews({ status: "approved", featured: true, limit });
}

// Hook for user's own reviews
export function useUserReviews(userId: string): UseReviewsResult {
  return useReviews({ userId });
}

// Function to submit a new review with order validation
export async function submitReview(reviewData: {
  customer_name: string;
  customer_email: string;
  user_id?: string;
  rating: number;
  title?: string;
  comment: string;
  order_id: string; // Now required for validation
  service_name?: string;
}): Promise<{ success: boolean; error?: string; review?: Review }> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Failed to submit review (${response.status})`;
      try {
        const result = await response.json();
        errorMessage = result.error || errorMessage;
      } catch (jsonError) {
        // If response isn't JSON, use the default error message
        console.warn("Non-JSON error response:", jsonError);
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error("Failed to parse response JSON:", jsonError);
      return {
        success: false,
        error: "Invalid response from server. Please try again.",
      };
    }

    return { success: true, review: result.review };
  } catch (err: any) {
    console.error("Error submitting review:", err);

    if (err.name === "AbortError") {
      return {
        success: false,
        error: "Request timed out. Please try again.",
      };
    }

    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
    };
  }
}

// Function to get user's completed orders for review selection
export async function getCompletedOrders(params: {
  user_id?: string;
  customer_email?: string;
}): Promise<{
  success: boolean;
  error?: string;
  orders?: Array<{
    id: string;
    order_number?: string;
    customer_name: string;
    services: any[];
    total_amount: number;
    completed_at: string;
    created_at: string;
    order_type: "regular" | "custom";
    has_review: boolean;
  }>;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (params.user_id) queryParams.append("user_id", params.user_id);
    if (params.customer_email)
      queryParams.append("customer_email", params.customer_email);

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(
      `/api/orders/completed?${queryParams.toString()}`,
      {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server returned ${response.status} error`;
      try {
        const result = await response.json();
        errorMessage = result.error || errorMessage;
      } catch (jsonError) {
        // If response isn't JSON, use the default error message
        console.warn("Non-JSON error response:", jsonError);
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error("Failed to parse response JSON:", jsonError);
      return {
        success: false,
        error: "Invalid response from server. Please try again.",
      };
    }

    return { success: true, orders: result.orders };
  } catch (err: any) {
    console.error("Error fetching completed orders:", err);

    if (err.name === "AbortError") {
      return {
        success: false,
        error: "Request timed out. Please try again.",
      };
    }

    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
    };
  }
}

// Function to update review status (admin only)
export async function updateReviewStatus(
  reviewId: string,
  status: "pending" | "approved" | "rejected",
  featured = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status,
      featured: featured && status === "approved" ? true : false,
    };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }

    if (featured && status === "approved") {
      updateData.featured_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", reviewId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error updating review status:", err);
    return {
      success: false,
      error: err.message || "Failed to update review status",
    };
  }
}

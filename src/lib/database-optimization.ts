// Database query optimization utilities for HelldiversBoost
import { supabase } from "@/integrations/supabase/client-no-realtime";

// Pagination interface
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Default pagination settings
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Optimized services query with pagination
export async function getServicesOptimized(
  options: PaginationOptions = {},
): Promise<PaginatedResult<any>> {
  const {
    page = 1,
    limit = DEFAULT_LIMIT,
    orderBy = "created_at",
    orderDirection = "desc",
  } = options;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  // First, get the total count (cached for 5 minutes)
  const { count: total } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  // Then get the paginated data with optimized query
  const { data, error } = await supabase
    .from("services")
    .select(
      `
      id,
      title,
      description,
      price,
      original_price,
      duration,
      difficulty,
      features,
      active,
      popular,
      category,
      created_at,
      orders_count
    `,
    )
    .eq("active", true)
    .order(orderBy, { ascending: orderDirection === "asc" })
    .range(offset, offset + safeLimit - 1);

  if (error) {
    console.error("Services query error:", error);
    throw error;
  }

  const totalPages = Math.ceil((total || 0) / safeLimit);

  return {
    data: data || [],
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: total || 0,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

// Optimized bundles query with pagination
export async function getBundlesOptimized(
  options: PaginationOptions = {},
): Promise<PaginatedResult<any>> {
  const {
    page = 1,
    limit = DEFAULT_LIMIT,
    orderBy = "created_at",
    orderDirection = "desc",
  } = options;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  // Get total count
  const { count: total } = await supabase
    .from("bundles")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  // Get paginated data
  const { data, error } = await supabase
    .from("bundles")
    .select(
      `
      id,
      title,
      description,
      services,
      original_price,
      discounted_price,
      savings_percentage,
      popular,
      active,
      created_at
    `,
    )
    .eq("active", true)
    .order(orderBy, { ascending: orderDirection === "asc" })
    .range(offset, offset + safeLimit - 1);

  if (error) {
    console.error("Bundles query error:", error);
    throw error;
  }

  const totalPages = Math.ceil((total || 0) / safeLimit);

  return {
    data: data || [],
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: total || 0,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

// Optimized orders query with filters and pagination
export async function getOrdersOptimized(
  userId?: string,
  options: PaginationOptions & {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {},
): Promise<PaginatedResult<any>> {
  const {
    page = 1,
    limit = DEFAULT_LIMIT,
    orderBy = "created_at",
    orderDirection = "desc",
    status,
    dateFrom,
    dateTo,
  } = options;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;

  // Build query with filters
  let query = supabase.from("orders").select("*", { count: "exact" });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  // Get total count with filters
  const { count: total } = await query;

  // Get paginated data
  const { data, error } = await query
    .order(orderBy, { ascending: orderDirection === "asc" })
    .range(offset, offset + safeLimit - 1);

  if (error) {
    console.error("Orders query error:", error);
    throw error;
  }

  const totalPages = Math.ceil((total || 0) / safeLimit);

  return {
    data: data || [],
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: total || 0,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

// Query result caching utility
const queryCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

export function getCachedQuery<T>(key: string): T | null {
  const cached = queryCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > cached.ttl) {
    queryCache.delete(key);
    return null;
  }

  return cached.data;
}

export function setCachedQuery<T>(
  key: string,
  data: T,
  ttlMs = 5 * 60 * 1000,
): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

// Batch query utility for related data
export async function batchQueries<T extends Record<string, any>>(
  queries: Array<{ key: keyof T; query: Promise<any> }>,
): Promise<T> {
  const results = await Promise.allSettled(queries.map((q) => q.query));
  const data = {} as T;

  results.forEach((result, index) => {
    const key = queries[index].key;
    if (result.status === "fulfilled") {
      data[key] = result.value;
    } else {
      console.error(`Batch query failed for ${String(key)}:`, result.reason);
      data[key] = null;
    }
  });

  return data;
}

// Database connection health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
}> {
  const start = performance.now();

  try {
    await supabase.from("services").select("id").limit(1).single();
    const latency = performance.now() - start;
    return { healthy: true, latency };
  } catch (error) {
    const latency = performance.now() - start;
    console.error("Database health check failed:", error);
    return { healthy: false, latency };
  }
}

// Query performance monitoring
export function monitorQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();

  return queryFn()
    .then((result) => {
      const duration = performance.now() - start;
      console.log(`[DB Query] ${queryName}: ${duration.toFixed(2)}ms`);

      // Track slow queries
      if (duration > 1000) {
        console.warn(`[DB Slow Query] ${queryName}: ${duration.toFixed(2)}ms`);
      }

      return result;
    })
    .catch((error) => {
      const duration = performance.now() - start;
      console.error(
        `[DB Query Error] ${queryName}: ${duration.toFixed(2)}ms`,
        error,
      );
      throw error;
    });
}

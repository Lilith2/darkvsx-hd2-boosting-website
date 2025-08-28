import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Query validation schema
const listProductsSchema = z.object({
  category: z.string().optional(),
  product_type: z.enum(['service', 'bundle', 'custom_item']).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'discontinued']).optional(),
  visibility: z.enum(['public', 'private', 'hidden']).optional(),
  featured: z.boolean().optional(),
  popular: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  search: z.string().optional(),
}).optional();

interface ProductFilters {
  category?: string;
  product_type?: 'service' | 'bundle' | 'custom_item';
  status?: 'draft' | 'active' | 'inactive' | 'discontinued';
  visibility?: 'public' | 'private' | 'hidden';
  featured?: boolean;
  popular?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Database access not configured",
      });
    }

    // Parse and validate query parameters
    const queryParams: ProductFilters = {};
    
    if (req.query.category) queryParams.category = req.query.category as string;
    if (req.query.product_type) queryParams.product_type = req.query.product_type as any;
    if (req.query.status) queryParams.status = req.query.status as any;
    if (req.query.visibility) queryParams.visibility = req.query.visibility as any;
    if (req.query.featured) queryParams.featured = req.query.featured === 'true';
    if (req.query.popular) queryParams.popular = req.query.popular === 'true';
    if (req.query.limit) queryParams.limit = parseInt(req.query.limit as string);
    if (req.query.offset) queryParams.offset = parseInt(req.query.offset as string);
    if (req.query.search) queryParams.search = req.query.search as string;

    const parseResult = listProductsSchema.safeParse(queryParams);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: parseResult.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", "),
      });
    }

    const filters = parseResult.data || {};

    // Build query
    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        short_description,
        product_type,
        category,
        subcategory,
        tags,
        base_price,
        sale_price,
        price_per_unit,
        minimum_quantity,
        maximum_quantity,
        features,
        specifications,
        requirements,
        estimated_duration_hours,
        difficulty_level,
        status,
        visibility,
        featured,
        popular,
        view_count,
        order_count,
        conversion_rate,
        bundled_products,
        bundle_type,
        created_at,
        updated_at,
        published_at
      `);

    // Apply filters
    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    
    if (filters.product_type) {
      query = query.eq("product_type", filters.product_type);
    }
    
    if (filters.status) {
      query = query.eq("status", filters.status);
    } else {
      // Default to active products only
      query = query.eq("status", "active");
    }
    
    if (filters.visibility) {
      query = query.eq("visibility", filters.visibility);
    } else {
      // Default to public products only
      query = query.eq("visibility", "public");
    }
    
    if (filters.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }
    
    if (filters.popular !== undefined) {
      query = query.eq("popular", filters.popular);
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Order by featured first, then popular, then order count
    query = query.order("featured", { ascending: false })
                .order("popular", { ascending: false })
                .order("order_count", { ascending: false })
                .order("created_at", { ascending: false });

    // Execute query
    const { data: products, error: productsError, count } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .match(filters)
      .range(offset, offset + limit - 1);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return res.status(500).json({
        error: "Failed to fetch products",
        details: productsError.message,
        code: productsError.code || "DATABASE_ERROR",
      });
    }

    // Transform products to include legacy compatibility fields
    const transformedProducts = (products || []).map(product => ({
      ...product,
      // Legacy compatibility
      title: product.name,
      price: product.sale_price || product.base_price,
      isBundle: product.product_type === 'bundle',
      duration: product.estimated_duration_hours ? `${product.estimated_duration_hours}h` : undefined,
      // Calculated effective price
      effective_price: product.sale_price || product.base_price,
      discount_percentage: product.sale_price && product.base_price > product.sale_price 
        ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)
        : 0,
    }));

    // Get category counts for filtering
    const { data: categoryCounts } = await supabase
      .from("products")
      .select("category")
      .eq("status", "active")
      .eq("visibility", "public");

    const categories = categoryCounts?.reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {}) || {};

    return res.status(200).json({
      success: true,
      products: transformedProducts,
      pagination: {
        total: count || 0,
        limit: limit,
        offset: offset,
        hasMore: (count || 0) > offset + limit,
      },
      filters: filters,
      categories: categories,
      stats: {
        total_products: count || 0,
        categories_count: Object.keys(categories).length,
        featured_count: transformedProducts.filter(p => p.featured).length,
        popular_count: transformedProducts.filter(p => p.popular).length,
      },
    });

  } catch (error: any) {
    console.error("Error in products list endpoint:", error);

    const errorMessage = error.message || "Failed to fetch products";
    const errorCode = error.code || "UNKNOWN_ERROR";

    return res.status(500).json({
      error: "Internal server error",
      details: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}

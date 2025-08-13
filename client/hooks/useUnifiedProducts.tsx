import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Enhanced product interface for the unified system
export interface UnifiedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  product_type: 'service' | 'bundle' | 'custom_item';
  category: string;
  subcategory?: string;
  tags: string[];
  base_price: number;
  sale_price?: number;
  current_price: number;
  cost_price?: number;
  price_per_unit?: number;
  minimum_quantity: number;
  maximum_quantity?: number;
  features: string[];
  specifications: Record<string, any>;
  requirements: string[];
  estimated_duration_hours?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert';
  auto_fulfill: boolean;
  stock_quantity?: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  gallery_images: string[];
  status: 'draft' | 'active' | 'inactive' | 'discontinued';
  visibility: 'public' | 'private' | 'hidden';
  featured: boolean;
  popular: boolean;
  view_count: number;
  order_count: number;
  conversion_rate: number;
  bundled_products: any[];
  bundle_type?: 'fixed' | 'flexible';
  created_at: string;
  updated_at: string;
  published_at?: string;
  deleted_at?: string;
  availability_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  discount_percentage: number;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  featured_products: number;
  total_revenue: number;
  avg_conversion_rate: number;
}

interface UnifiedProductsContextType {
  products: UnifiedProduct[];
  stats: ProductStats;
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  createProduct: (productData: Partial<UnifiedProduct>) => Promise<string>;
  updateProduct: (productId: string, updates: Partial<UnifiedProduct>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Promise<UnifiedProduct | null>;
  getProductBySlug: (slug: string) => Promise<UnifiedProduct | null>;
  getProductsByCategory: (category: string) => Promise<UnifiedProduct[]>;
  getActiveProducts: () => Promise<UnifiedProduct[]>;
  getFeaturedProducts: () => Promise<UnifiedProduct[]>;
  searchProducts: (query: string) => Promise<UnifiedProduct[]>;
  updateProductAnalytics: (productId: string, incrementViews?: number, incrementOrders?: number) => Promise<void>;
}

const UnifiedProductsContext = createContext<UnifiedProductsContextType | undefined>(undefined);

export function UnifiedProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total_products: 0,
    active_products: 0,
    featured_products: 0,
    total_revenue: 0,
    avg_conversion_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from the unified products table
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("product_catalog_view")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformedProducts: UnifiedProduct[] = (data || []).map((product: any) => ({
        ...product,
        tags: product.tags || [],
        features: product.features || [],
        specifications: product.specifications || {},
        requirements: product.requirements || [],
        gallery_images: product.gallery_images || [],
        bundled_products: product.bundled_products || [],
      }));

      setProducts(transformedProducts);
    } catch (err: any) {
      console.error("Error fetching unified products:", err?.message || err);
      setError(err?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Calculate product statistics
  const calculateStats = async () => {
    try {
      const { data, error: statsError } = await supabase
        .from("products")
        .select("status, featured, view_count, order_count, conversion_rate")
        .is("deleted_at", null);

      if (statsError) {
        throw statsError;
      }

      const totalProducts = data?.length || 0;
      const activeProducts = data?.filter(p => p.status === 'active').length || 0;
      const featuredProducts = data?.filter(p => p.featured).length || 0;
      const avgConversionRate = totalProducts > 0 
        ? data.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / totalProducts 
        : 0;

      // Get revenue data from product performance view
      const { data: revenueData } = await supabase
        .from("product_performance_summary")
        .select("total_revenue");

      const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.total_revenue || 0), 0) || 0;

      setStats({
        total_products: totalProducts,
        active_products: activeProducts,
        featured_products: featuredProducts,
        total_revenue: totalRevenue,
        avg_conversion_rate: avgConversionRate,
      });
    } catch (err: any) {
      console.error("Error calculating product stats:", err);
    }
  };

  // Create a new product
  const createProduct = async (productData: Partial<UnifiedProduct>): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([{
          ...productData,
          status: productData.status || 'draft',
          visibility: productData.visibility || 'public',
          product_type: productData.product_type || 'service',
          category: productData.category || 'General',
          base_price: productData.base_price || 0,
          minimum_quantity: productData.minimum_quantity || 1,
          auto_fulfill: productData.auto_fulfill || false,
          track_inventory: productData.track_inventory || false,
          allow_backorder: productData.allow_backorder || true,
          featured: productData.featured || false,
          popular: productData.popular || false,
          view_count: 0,
          order_count: 0,
          conversion_rate: 0,
          tags: productData.tags || [],
          features: productData.features || [],
          specifications: productData.specifications || {},
          requirements: productData.requirements || [],
          gallery_images: productData.gallery_images || [],
          bundled_products: productData.bundled_products || [],
        }])
        .select()
        .single();

      if (error) throw error;

      await refreshProducts();
      return data.id;
    } catch (err: any) {
      console.error("Error creating product:", err);
      throw new Error(err?.message || "Failed to create product");
    }
  };

  // Update an existing product
  const updateProduct = async (productId: string, updates: Partial<UnifiedProduct>) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) throw error;

      await refreshProducts();
    } catch (err: any) {
      console.error("Error updating product:", err);
      throw new Error(err?.message || "Failed to update product");
    }
  };

  // Soft delete a product
  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) throw error;

      await refreshProducts();
    } catch (err: any) {
      console.error("Error deleting product:", err);
      throw new Error(err?.message || "Failed to delete product");
    }
  };

  // Get a specific product by ID
  const getProductById = async (productId: string): Promise<UnifiedProduct | null> => {
    try {
      const { data, error } = await supabase
        .from("product_catalog_view")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        ...data,
        tags: data.tags || [],
        features: data.features || [],
        specifications: data.specifications || {},
        requirements: data.requirements || [],
        gallery_images: data.gallery_images || [],
        bundled_products: data.bundled_products || [],
      };
    } catch (err: any) {
      console.error("Error fetching product by ID:", err);
      throw new Error(err?.message || "Failed to fetch product");
    }
  };

  // Get a product by slug
  const getProductBySlug = async (slug: string): Promise<UnifiedProduct | null> => {
    try {
      const { data, error } = await supabase
        .from("product_catalog_view")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        ...data,
        tags: data.tags || [],
        features: data.features || [],
        specifications: data.specifications || {},
        requirements: data.requirements || [],
        gallery_images: data.gallery_images || [],
        bundled_products: data.bundled_products || [],
      };
    } catch (err: any) {
      console.error("Error fetching product by slug:", err);
      throw new Error(err?.message || "Failed to fetch product");
    }
  };

  // Get products by category
  const getProductsByCategory = async (category: string): Promise<UnifiedProduct[]> => {
    try {
      const { data, error } = await supabase
        .from("product_catalog_view")
        .select("*")
        .eq("category", category)
        .eq("status", "active")
        .eq("visibility", "public")
        .order("featured", { ascending: false })
        .order("popular", { ascending: false })
        .order("order_count", { ascending: false });

      if (error) throw error;

      return (data || []).map((product: any) => ({
        ...product,
        tags: product.tags || [],
        features: product.features || [],
        specifications: product.specifications || {},
        requirements: product.requirements || [],
        gallery_images: product.gallery_images || [],
        bundled_products: product.bundled_products || [],
      }));
    } catch (err: any) {
      console.error("Error fetching products by category:", err);
      throw new Error(err?.message || "Failed to fetch products");
    }
  };

  // Get active products
  const getActiveProducts = async (): Promise<UnifiedProduct[]> => {
    try {
      const { data, error } = await supabase
        .from("product_catalog_view")
        .select("*")
        .eq("status", "active")
        .eq("visibility", "public")
        .order("featured", { ascending: false })
        .order("order_count", { ascending: false });

      if (error) throw error;

      return (data || []).map((product: any) => ({
        ...product,
        tags: product.tags || [],
        features: product.features || [],
        specifications: product.specifications || {},
        requirements: product.requirements || [],
        gallery_images: product.gallery_images || [],
        bundled_products: product.bundled_products || [],
      }));
    } catch (err: any) {
      console.error("Error fetching active products:", err);
      throw new Error(err?.message || "Failed to fetch active products");
    }
  };

  // Get featured products
  const getFeaturedProducts = async (): Promise<UnifiedProduct[]> => {
    try {
      const { data, error } = await supabase
        .from("product_catalog_view")
        .select("*")
        .eq("status", "active")
        .eq("visibility", "public")
        .eq("featured", true)
        .order("order_count", { ascending: false })
        .limit(6);

      if (error) throw error;

      return (data || []).map((product: any) => ({
        ...product,
        tags: product.tags || [],
        features: product.features || [],
        specifications: product.specifications || {},
        requirements: product.requirements || [],
        gallery_images: product.gallery_images || [],
        bundled_products: product.bundled_products || [],
      }));
    } catch (err: any) {
      console.error("Error fetching featured products:", err);
      throw new Error(err?.message || "Failed to fetch featured products");
    }
  };

  // Search products
  const searchProducts = async (query: string): Promise<UnifiedProduct[]> => {
    try {
      const { data, error } = await supabase
        .from("product_catalog_view")
        .select("*")
        .eq("status", "active")
        .eq("visibility", "public")
        .textSearch("name", query)
        .order("order_count", { ascending: false });

      if (error) throw error;

      return (data || []).map((product: any) => ({
        ...product,
        tags: product.tags || [],
        features: product.features || [],
        specifications: product.specifications || {},
        requirements: product.requirements || [],
        gallery_images: product.gallery_images || [],
        bundled_products: product.bundled_products || [],
      }));
    } catch (err: any) {
      console.error("Error searching products:", err);
      throw new Error(err?.message || "Failed to search products");
    }
  };

  // Update product analytics
  const updateProductAnalytics = async (
    productId: string, 
    incrementViews = 0, 
    incrementOrders = 0
  ) => {
    try {
      await supabase.rpc('update_product_analytics', {
        p_product_id: productId,
        p_increment_views: incrementViews,
        p_increment_orders: incrementOrders,
      });
    } catch (err: any) {
      console.error("Error updating product analytics:", err);
      // Don't throw error for analytics updates to avoid breaking user flow
    }
  };

  // Refresh products and stats
  const refreshProducts = async () => {
    await Promise.all([fetchProducts(), calculateStats()]);
  };

  // Initialize data
  useEffect(() => {
    refreshProducts();
  }, []);

  const contextValue: UnifiedProductsContextType = {
    products,
    stats,
    loading,
    error,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductBySlug,
    getProductsByCategory,
    getActiveProducts,
    getFeaturedProducts,
    searchProducts,
    updateProductAnalytics,
  };

  return (
    <UnifiedProductsContext.Provider value={contextValue}>
      {children}
    </UnifiedProductsContext.Provider>
  );
}

export function useUnifiedProducts() {
  const context = useContext(UnifiedProductsContext);
  if (context === undefined) {
    throw new Error("useUnifiedProducts must be used within a UnifiedProductsProvider");
  }
  return context;
}

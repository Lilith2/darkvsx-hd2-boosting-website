import { useState, useEffect, useCallback } from "react";
import { UnifiedProduct } from "./useUnifiedCart";

interface UseProductsOptions {
  category?: string;
  product_type?: "service" | "bundle" | "custom_item";
  status?: "draft" | "active" | "inactive" | "discontinued";
  featured?: boolean;
  popular?: boolean;
  search?: string;
  limit?: number;
}

interface ProductsResponse {
  products: UnifiedProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  categories: Record<string, number>;
  stats: {
    total_products: number;
    categories_count: number;
    featured_count: number;
    popular_count: number;
  };
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    ProductsResponse["pagination"] | null
  >(null);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<ProductsResponse["stats"] | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();

      if (options.category) queryParams.append("category", options.category);
      if (options.product_type)
        queryParams.append("product_type", options.product_type);
      if (options.status) queryParams.append("status", options.status);
      if (options.featured !== undefined)
        queryParams.append("featured", options.featured.toString());
      if (options.popular !== undefined)
        queryParams.append("popular", options.popular.toString());
      if (options.search) queryParams.append("search", options.search);
      if (options.limit) queryParams.append("limit", options.limit.toString());

      const response = await fetch(
        `/api/products/list?${queryParams.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to fetch products",
        );
      }

      const data: ProductsResponse = await response.json();

      setProducts(data.products);
      setPagination(data.pagination);
      setCategories(data.categories);
      setStats(data.stats);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [
    options.category,
    options.product_type,
    options.status,
    options.featured,
    options.popular,
    options.search,
    options.limit,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Legacy compatibility - filter by category on the client side if needed
  const servicesByCategory = useCallback(
    (category?: string) => {
      if (!category) return products;
      return products.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase(),
      );
    },
    [products],
  );

  // Legacy compatibility - get bundles
  const bundles = products.filter(
    (product) => product.product_type === "bundle",
  );

  // Legacy compatibility - get services
  const services = products.filter(
    (product) => product.product_type === "service",
  );

  // Legacy compatibility - get custom items
  const customItems = products.filter(
    (product) => product.product_type === "custom_item",
  );

  return {
    products,
    services, // Legacy compatibility
    bundles, // Legacy compatibility
    customItems,
    servicesByCategory, // Legacy compatibility
    loading,
    error,
    pagination,
    categories,
    stats,
    refetch,
    // Legacy compatibility aliases
    isLoading: loading,
    refetchServices: refetch,
    refetchBundles: refetch,
  };
}

// Legacy compatibility hooks
export const useServices = (options: UseProductsOptions = {}) => {
  return useProducts({ ...options, product_type: "service" });
};

export const useBundles = (options: UseProductsOptions = {}) => {
  return useProducts({ ...options, product_type: "bundle" });
};

export const useCustomPricing = (options: UseProductsOptions = {}) => {
  return useProducts({ ...options, product_type: "custom_item" });
};

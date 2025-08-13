import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface UnifiedProduct {
  id: string;
  name: string;
  description: string | null;
  type: 'service' | 'bundle' | 'custom';
  category: string | null;
  price: number;
  base_price: number | null;
  currency: string;
  is_active: boolean;
  metadata: Record<string, any> | null;
  image_url: string | null;
  tags: string[] | null;
  availability_status: 'available' | 'limited' | 'out_of_stock' | 'discontinued';
  min_quantity: number;
  max_quantity: number | null;
  estimated_delivery_days: number | null;
  requirements: Record<string, any> | null;
  features: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProductFilters {
  type?: 'service' | 'bundle' | 'custom';
  category?: string;
  isActive?: boolean;
  availabilityStatus?: 'available' | 'limited' | 'out_of_stock' | 'discontinued';
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
}

export interface ProductSort {
  field: 'name' | 'price' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

interface UnifiedProductsContextType {
  products: UnifiedProduct[];
  loading: boolean;
  error: string | null;
  
  // CRUD Operations
  createProduct: (productData: Partial<UnifiedProduct>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<UnifiedProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;
  restoreProduct: (id: string) => Promise<void>;
  
  // Fetching
  getProductById: (id: string) => Promise<UnifiedProduct | null>;
  searchProducts: (filters: ProductFilters, sort?: ProductSort) => Promise<UnifiedProduct[]>;
  getProductsByCategory: (category: string) => Promise<UnifiedProduct[]>;
  getProductsByType: (type: 'service' | 'bundle' | 'custom') => Promise<UnifiedProduct[]>;
  getFeaturedProducts: () => Promise<UnifiedProduct[]>;
  getPopularProducts: (limit?: number) => Promise<UnifiedProduct[]>;
  
  // Bulk Operations
  bulkUpdateProducts: (updates: Array<{ id: string; data: Partial<UnifiedProduct> }>) => Promise<void>;
  bulkArchiveProducts: (ids: string[]) => Promise<void>;
  bulkRestoreProducts: (ids: string[]) => Promise<void>;
  
  // Analytics
  getProductStats: (productId: string) => Promise<{
    total_orders: number;
    total_revenue: number;
    avg_rating: number;
    last_ordered: string | null;
  }>;
  
  // Utility
  refreshProducts: () => Promise<void>;
  clearError: () => void;
}

const UnifiedProductsContext = createContext<UnifiedProductsContextType | undefined>(undefined);

export const useUnifiedProducts = () => {
  const context = useContext(UnifiedProductsContext);
  if (context === undefined) {
    throw new Error('useUnifiedProducts must be used within a UnifiedProductsProvider');
  }
  return context;
};

interface UnifiedProductsProviderProps {
  children: ReactNode;
}

export const UnifiedProductsProvider = ({ children }: UnifiedProductsProviderProps) => {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle errors
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    setError(error?.message || `Failed to ${operation}`);
    throw error;
  };

  // Create a new product
  const createProduct = async (productData: Partial<UnifiedProduct>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          type: productData.type || 'service',
          currency: productData.currency || 'USD',
          is_active: productData.is_active !== undefined ? productData.is_active : true,
          availability_status: productData.availability_status || 'available',
          min_quantity: productData.min_quantity || 1,
          price: productData.price || 0,
        }])
        .select()
        .single();

      if (error) throw error;
      
      await refreshProducts();
      return data.id;
    } catch (error) {
      handleError(error, 'create product');
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Update an existing product
  const updateProduct = async (id: string, updates: Partial<UnifiedProduct>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      await refreshProducts();
    } catch (error) {
      handleError(error, 'update product');
    } finally {
      setLoading(false);
    }
  };

  // Delete a product (hard delete)
  const deleteProduct = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await refreshProducts();
    } catch (error) {
      handleError(error, 'delete product');
    } finally {
      setLoading(false);
    }
  };

  // Archive a product (soft delete)
  const archiveProduct = async (id: string): Promise<void> => {
    await updateProduct(id, { 
      is_active: false, 
      availability_status: 'discontinued' 
    });
  };

  // Restore an archived product
  const restoreProduct = async (id: string): Promise<void> => {
    await updateProduct(id, { 
      is_active: true, 
      availability_status: 'available' 
    });
  };

  // Get product by ID
  const getProductById = async (id: string): Promise<UnifiedProduct | null> => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'get product by ID');
      return null;
    }
  };

  // Search products with filters and sorting
  const searchProducts = async (filters: ProductFilters, sort?: ProductSort): Promise<UnifiedProduct[]> => {
    try {
      setError(null);

      let query = supabase.from('products').select('*');

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.availabilityStatus) {
        query = query.eq('availability_status', filters.availabilityStatus);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'search products');
      return [];
    }
  };

  // Get products by category
  const getProductsByCategory = async (category: string): Promise<UnifiedProduct[]> => {
    return searchProducts({ category, isActive: true });
  };

  // Get products by type
  const getProductsByType = async (type: 'service' | 'bundle' | 'custom'): Promise<UnifiedProduct[]> => {
    return searchProducts({ type, isActive: true });
  };

  // Get featured products (products with featured tag)
  const getFeaturedProducts = async (): Promise<UnifiedProduct[]> => {
    return searchProducts({ 
      tags: ['featured'], 
      isActive: true,
      availabilityStatus: 'available'
    });
  };

  // Get popular products based on order analytics
  const getPopularProducts = async (limit = 10): Promise<UnifiedProduct[]> => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('product_analytics_view')
        .select(`
          product_id,
          total_orders,
          products!inner(*)
        `)
        .eq('products.is_active', true)
        .eq('products.availability_status', 'available')
        .order('total_orders', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data?.map(item => item.products) || [];
    } catch (error) {
      handleError(error, 'get popular products');
      return [];
    }
  };

  // Bulk update products
  const bulkUpdateProducts = async (updates: Array<{ id: string; data: Partial<UnifiedProduct> }>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const promises = updates.map(({ id, data }) =>
        supabase
          .from('products')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} products`);
      }

      await refreshProducts();
    } catch (error) {
      handleError(error, 'bulk update products');
    } finally {
      setLoading(false);
    }
  };

  // Bulk archive products
  const bulkArchiveProducts = async (ids: string[]): Promise<void> => {
    const updates = ids.map(id => ({
      id,
      data: { 
        is_active: false, 
        availability_status: 'discontinued' as const 
      }
    }));
    await bulkUpdateProducts(updates);
  };

  // Bulk restore products
  const bulkRestoreProducts = async (ids: string[]): Promise<void> => {
    const updates = ids.map(id => ({
      id,
      data: { 
        is_active: true, 
        availability_status: 'available' as const 
      }
    }));
    await bulkUpdateProducts(updates);
  };

  // Get product statistics
  const getProductStats = async (productId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('product_analytics_view')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;
      
      return {
        total_orders: data?.total_orders || 0,
        total_revenue: data?.total_revenue || 0,
        avg_rating: data?.avg_rating || 0,
        last_ordered: data?.last_ordered || null,
      };
    } catch (error) {
      handleError(error, 'get product stats');
      return {
        total_orders: 0,
        total_revenue: 0,
        avg_rating: 0,
        last_ordered: null,
      };
    }
  };

  // Refresh products from database
  const refreshProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      handleError(error, 'refresh products');
    } finally {
      setLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Load products on mount
  useEffect(() => {
    refreshProducts();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          refreshProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value: UnifiedProductsContextType = {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    restoreProduct,
    getProductById,
    searchProducts,
    getProductsByCategory,
    getProductsByType,
    getFeaturedProducts,
    getPopularProducts,
    bulkUpdateProducts,
    bulkArchiveProducts,
    bulkRestoreProducts,
    getProductStats,
    refreshProducts,
    clearError,
  };

  return (
    <UnifiedProductsContext.Provider value={value}>
      {children}
    </UnifiedProductsContext.Provider>
  );
};

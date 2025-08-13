import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUnifiedProducts } from './useUnifiedProducts';
import type { Tables } from "@/integrations/supabase/types";

export type Bundle = Tables<"bundles">;

export interface BundleData {
  id: string;
  name: string;
  description: string;
  services: string[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  duration: string;
  popular?: boolean;
  badge?: string;
  features: string[];
  active: boolean;
  createdAt: string;
  orders: number;
}

interface BundlesContextType {
  bundles: BundleData[];
  loading: boolean;
  error: string | null;
  refreshBundles: () => Promise<void>;
  addBundle: (bundle: Omit<Bundle, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateBundle: (id: string, updates: Partial<Bundle>) => Promise<void>;
  deleteBundle: (id: string) => Promise<void>;
  toggleBundleStatus: (id: string) => Promise<void>;
}

const BundlesContext = createContext<BundlesContextType | undefined>(undefined);

export function BundlesProvider({ children }: { children: ReactNode }) {
  const { 
    products, 
    loading, 
    error, 
    searchProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    refreshProducts
  } = useUnifiedProducts();
  
  const [bundles, setBundles] = useState<BundleData[]>([]);

  // Transform unified products to bundle format
  const transformProductToBundle = (product: any): BundleData => ({
    id: product.id,
    name: product.name,
    description: product.description || '',
    services: product.features || [],
    originalPrice: product.base_price || product.price,
    discountedPrice: product.price,
    discount: product.base_price 
      ? Math.round(((product.base_price - product.price) / product.base_price) * 100)
      : 0,
    duration: product.metadata?.duration || 'Unknown',
    popular: product.tags?.includes('popular') || false,
    badge: product.tags?.find(tag => ['featured', 'popular', 'new'].includes(tag)),
    features: product.features || [],
    active: product.is_active,
    createdAt: product.created_at,
    orders: 0, // Would need to be calculated from analytics
  });

  // Get bundles from unified products (type = 'bundle')
  const refreshBundles = async () => {
    try {
      const bundleProducts = await searchProducts({ type: 'bundle', isActive: true });
      const transformedBundles = bundleProducts.map(transformProductToBundle);
      setBundles(transformedBundles);
    } catch (error) {
      console.error('Error refreshing bundles:', error);
    }
  };

  const addBundle = async (bundleData: Omit<Bundle, "id" | "created_at" | "updated_at">) => {
    try {
      await createProduct({
        name: bundleData.name || '',
        description: bundleData.description,
        type: 'bundle',
        price: Number(bundleData.discounted_price) || 0,
        base_price: Number(bundleData.original_price) || 0,
        currency: 'USD',
        is_active: bundleData.active ?? true,
        features: bundleData.features || [],
        tags: [
          ...(bundleData.popular ? ['popular'] : []),
          ...(bundleData.badge ? [bundleData.badge.toLowerCase()] : [])
        ],
        metadata: {
          duration: bundleData.duration,
          services: bundleData.services,
          discount: bundleData.discount,
        },
      });
      await refreshBundles();
    } catch (error) {
      console.error('Error adding bundle:', error);
      throw error;
    }
  };

  const updateBundle = async (id: string, updates: Partial<Bundle>) => {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.discounted_price) updateData.price = Number(updates.discounted_price);
      if (updates.original_price) updateData.base_price = Number(updates.original_price);
      if (updates.active !== undefined) updateData.is_active = updates.active;
      if (updates.features) updateData.features = updates.features;
      
      if (updates.popular !== undefined || updates.badge) {
        const currentProduct = products.find(p => p.id === id);
        const currentTags = currentProduct?.tags || [];
        const newTags = [...currentTags.filter(tag => !['popular', 'featured', 'new'].includes(tag))];
        
        if (updates.popular) newTags.push('popular');
        if (updates.badge) newTags.push(updates.badge.toLowerCase());
        
        updateData.tags = newTags;
      }
      
      if (updates.duration || updates.services || updates.discount) {
        const currentProduct = products.find(p => p.id === id);
        updateData.metadata = {
          ...currentProduct?.metadata,
          ...(updates.duration && { duration: updates.duration }),
          ...(updates.services && { services: updates.services }),
          ...(updates.discount && { discount: updates.discount }),
        };
      }

      await updateProduct(id, updateData);
      await refreshBundles();
    } catch (error) {
      console.error('Error updating bundle:', error);
      throw error;
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      await deleteProduct(id);
      await refreshBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      throw error;
    }
  };

  const toggleBundleStatus = async (id: string) => {
    try {
      const bundle = bundles.find(b => b.id === id);
      if (!bundle) return;

      await updateProduct(id, { is_active: !bundle.active });
      await refreshBundles();
    } catch (error) {
      console.error('Error toggling bundle status:', error);
      throw error;
    }
  };

  // Update bundles when products change
  useEffect(() => {
    refreshBundles();
  }, [products]);

  return (
    <BundlesContext.Provider
      value={{
        bundles,
        loading,
        error,
        refreshBundles,
        addBundle,
        updateBundle,
        deleteBundle,
        toggleBundleStatus,
      }}
    >
      {children}
    </BundlesContext.Provider>
  );
}

export function useBundles() {
  const context = useContext(BundlesContext);
  if (context === undefined) {
    throw new Error("useBundles must be used within a BundlesProvider");
  }
  return context;
}

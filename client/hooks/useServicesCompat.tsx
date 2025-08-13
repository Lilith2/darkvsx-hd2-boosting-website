import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUnifiedProducts } from './useUnifiedProducts';
import type { Tables } from "@/integrations/supabase/types";

export type Service = Tables<"services">;

export interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: string;
  difficulty: string;
  features: string[];
  active: boolean;
  popular?: boolean;
  category: "Level Boost" | "Medals" | "Samples" | "Super Credits" | "Promotions";
  createdAt: string;
  orders: number;
}

interface ServicesContextType {
  services: ServiceData[];
  loading: boolean;
  error: string | null;
  refreshServices: () => Promise<void>;
  addService: (service: Omit<Service, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
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
  
  const [services, setServices] = useState<ServiceData[]>([]);

  // Transform unified products to service format
  const transformProductToService = (product: any): ServiceData => ({
    id: product.id,
    title: product.name,
    description: product.description || '',
    price: product.price,
    originalPrice: product.base_price || undefined,
    duration: product.metadata?.duration || product.estimated_delivery_days ? `${product.estimated_delivery_days} days` : 'Unknown',
    difficulty: product.metadata?.difficulty || 'Normal',
    features: product.features || [],
    active: product.is_active,
    popular: product.tags?.includes('popular') || false,
    category: product.category || 'Level Boost',
    createdAt: product.created_at,
    orders: 0, // Would need to be calculated from analytics
  });

  // Get services from unified products (type = 'service')
  const refreshServices = async () => {
    try {
      const serviceProducts = await searchProducts({ type: 'service', isActive: true });
      const transformedServices = serviceProducts.map(transformProductToService);
      setServices(transformedServices);
    } catch (error) {
      console.error('Error refreshing services:', error);
    }
  };

  const addService = async (serviceData: Omit<Service, "id" | "created_at" | "updated_at">) => {
    try {
      await createProduct({
        name: serviceData.title,
        description: serviceData.description,
        type: 'service',
        category: serviceData.category,
        price: Number(serviceData.price) || 0,
        base_price: serviceData.original_price ? Number(serviceData.original_price) : undefined,
        currency: 'USD',
        is_active: serviceData.active ?? true,
        features: serviceData.features || [],
        tags: [
          ...(serviceData.popular ? ['popular'] : [])
        ],
        metadata: {
          duration: serviceData.duration,
          difficulty: serviceData.difficulty,
        },
      });
      await refreshServices();
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.name = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.category) updateData.category = updates.category;
      if (updates.price) updateData.price = Number(updates.price);
      if (updates.original_price) updateData.base_price = Number(updates.original_price);
      if (updates.active !== undefined) updateData.is_active = updates.active;
      if (updates.features) updateData.features = updates.features;
      
      if (updates.popular !== undefined) {
        const currentProduct = products.find(p => p.id === id);
        const currentTags = currentProduct?.tags || [];
        const newTags = [...currentTags.filter(tag => tag !== 'popular')];
        
        if (updates.popular) newTags.push('popular');
        updateData.tags = newTags;
      }
      
      if (updates.duration || updates.difficulty) {
        const currentProduct = products.find(p => p.id === id);
        updateData.metadata = {
          ...currentProduct?.metadata,
          ...(updates.duration && { duration: updates.duration }),
          ...(updates.difficulty && { difficulty: updates.difficulty }),
        };
      }

      await updateProduct(id, updateData);
      await refreshServices();
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    try {
      await deleteProduct(id);
      await refreshServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  };

  const toggleServiceStatus = async (id: string) => {
    try {
      const service = services.find(s => s.id === id);
      if (!service) return;

      await updateProduct(id, { is_active: !service.active });
      await refreshServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
      throw error;
    }
  };

  // Update services when products change
  useEffect(() => {
    refreshServices();
  }, [products]);

  return (
    <ServicesContext.Provider
      value={{
        services,
        loading,
        error,
        refreshServices,
        addService,
        updateService,
        deleteService,
        toggleServiceStatus,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServicesProvider");
  }
  return context;
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, type Service } from '../lib/supabase';

// Re-export Service type for external use
export type { Service } from '../lib/supabase';

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
  category: 'Level Boost' | 'Medals' | 'Samples' | 'Super Credits' | 'Promotions';
  createdAt: string;
  orders: number;
}

interface ServicesContextType {
  services: ServiceData[];
  loading: boolean;
  error: string | null;
  refreshServices: () => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapService = (service: Service): ServiceData => ({
    id: service.id,
    title: service.title,
    description: service.description,
    price: Number(service.price),
    originalPrice: service.original_price ? Number(service.original_price) : undefined,
    duration: service.duration,
    difficulty: service.difficulty,
    features: service.features,
    active: service.active,
    popular: service.popular,
    category: service.category,
    createdAt: service.created_at,
    orders: service.orders_count
  });

  const refreshServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedServices = data?.map(mapService) || [];
      setServices(mappedServices);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const addService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('services').insert([serviceData]);
      if (error) throw error;
      await refreshServices();
    } catch (err) {
      console.error('Error adding service:', err);
      throw err;
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { error } = await supabase.from('services').update(updates).eq('id', id);
      if (error) throw error;
      await refreshServices();
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      await refreshServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      throw err;
    }
  };

  const toggleServiceStatus = async (id: string) => {
    try {
      const service = services.find(s => s.id === id);
      if (!service) return;
      
      const { error } = await supabase
        .from('services')
        .update({ active: !service.active })
        .eq('id', id);
      
      if (error) throw error;
      await refreshServices();
    } catch (err) {
      console.error('Error toggling service status:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshServices();
  }, []);

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

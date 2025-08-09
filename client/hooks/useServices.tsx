import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, type Service } from '../lib/supabase';

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

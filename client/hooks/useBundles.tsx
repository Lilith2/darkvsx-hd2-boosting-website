import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from '../lib/supabase';

export interface Bundle {
  id: string;
  name: string;
  description: string;
  services: string[];
  original_price: number;
  discounted_price: number;
  discount: number;
  duration: string;
  popular: boolean;
  badge: string | null;
  features: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  orders_count: number;
}

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
  addBundle: (bundle: Omit<Bundle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBundle: (id: string, updates: Partial<Bundle>) => Promise<void>;
  deleteBundle: (id: string) => Promise<void>;
  toggleBundleStatus: (id: string) => Promise<void>;
}

const BundlesContext = createContext<BundlesContextType | undefined>(undefined);

export function BundlesProvider({ children }: { children: ReactNode }) {
  const [bundles, setBundles] = useState<BundleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapBundle = (bundle: Bundle): BundleData => ({
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    services: bundle.services,
    originalPrice: Number(bundle.original_price),
    discountedPrice: Number(bundle.discounted_price),
    discount: bundle.discount,
    duration: bundle.duration,
    popular: bundle.popular,
    badge: bundle.badge || undefined,
    features: bundle.features,
    active: bundle.active,
    createdAt: bundle.created_at,
    orders: bundle.orders_count
  });

  const refreshBundles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bundles')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedBundles = data?.map(mapBundle) || [];
      setBundles(mappedBundles);
    } catch (err: any) {
      console.error('Error fetching bundles:', err);
      const errorMessage = err?.message || err?.error_description || 'Failed to load bundles';
      setError(`Failed to load bundles: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const addBundle = async (bundleData: Omit<Bundle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.from('bundles').insert([bundleData]);
      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error('Error adding bundle:', err);
      throw new Error(err?.message || err?.error_description || 'Failed to add bundle');
    }
  };

  const updateBundle = async (id: string, updates: Partial<Bundle>) => {
    try {
      const { error } = await supabase.from('bundles').update(updates).eq('id', id);
      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error('Error updating bundle:', err);
      throw new Error(err?.message || err?.error_description || 'Failed to update bundle');
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      const { error } = await supabase.from('bundles').delete().eq('id', id);
      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error('Error deleting bundle:', err);
      throw new Error(err?.message || err?.error_description || 'Failed to delete bundle');
    }
  };

  const toggleBundleStatus = async (id: string) => {
    try {
      const bundle = bundles.find(b => b.id === id);
      if (!bundle) return;
      
      const { error } = await supabase
        .from('bundles')
        .update({ active: !bundle.active })
        .eq('id', id);
      
      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error('Error toggling bundle status:', err);
      throw new Error(err?.message || err?.error_description || 'Failed to toggle bundle status');
    }
  };

  useEffect(() => {
    refreshBundles();
  }, []);

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

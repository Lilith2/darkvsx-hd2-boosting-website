import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Bundle = Tables<"bundles">;

// Use the Supabase generated type

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
  addBundle: (
    bundle: Omit<Bundle, "id" | "created_at" | "updated_at">,
  ) => Promise<void>;
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
    name: bundle.name || '',
    description: bundle.description || '',
    services: bundle.services || [],
    originalPrice: Number(bundle.original_price) || 0,
    discountedPrice: Number(bundle.discounted_price) || 0,
    discount: bundle.discount || 0,
    duration: bundle.duration || '',
    popular: bundle.popular || false,
    badge: bundle.badge || undefined,
    features: bundle.features || [],
    active: bundle.active ?? true,
    createdAt: bundle.created_at || '',
    orders: bundle.orders_count || 0,
  });

  const refreshBundles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("bundles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        // Check if it's a table not found error (likely means database not set up)
        if (
          fetchError.code === "PGRST116" ||
          fetchError.message?.includes("relation") ||
          fetchError.message?.includes("does not exist")
        ) {
          console.warn(
            "Bundles table not found - using demo data. Set up your Supabase database to persist real data.",
          );
          setBundles([]); // Empty bundles array for demo
          setError(null);
          return;
        }
        throw fetchError;
      }

      const mappedBundles = data?.map(mapBundle) || [];
      setBundles(mappedBundles);
    } catch (err: any) {
      console.error("Error fetching bundles:", err);
      const errorMessage =
        err?.message || err?.error_description || "Failed to load bundles";

      // Check for database connection issues
      if (
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError")
      ) {
        setError(
          "Unable to connect to database. Please check your internet connection.",
        );
      } else {
        setError(`Database error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const addBundle = async (
    bundleData: Omit<Bundle, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      const { error } = await supabase.from("bundles").insert([bundleData]);
      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error("Error adding bundle:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to add bundle",
      );
    }
  };

  const updateBundle = async (id: string, updates: Partial<Bundle>) => {
    try {
      const { error } = await supabase
        .from("bundles")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error("Error updating bundle:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to update bundle",
      );
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      const { error } = await supabase.from("bundles").delete().eq("id", id);
      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error("Error deleting bundle:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to delete bundle",
      );
    }
  };

  const toggleBundleStatus = async (id: string) => {
    try {
      const bundle = bundles.find((b) => b.id === id);
      if (!bundle) return;

      const { error } = await supabase
        .from("bundles")
        .update({ active: !bundle.active })
        .eq("id", id);

      if (error) throw error;
      await refreshBundles();
    } catch (err: any) {
      console.error("Error toggling bundle status:", err);
      throw new Error(
        err?.message ||
          err?.error_description ||
          "Failed to toggle bundle status",
      );
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

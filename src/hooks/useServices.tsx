import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
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
  category:
    | "Level Boost"
    | "Medals"
    | "Samples"
    | "Super Credits"
    | "Promotions";
  createdAt: string;
  orders_count: number;
  customOrderData?: {
    items: Array<{
      category: string;
      item_name: string;
      quantity: number;
      price_per_unit: number;
      total_price: number;
      description: string;
    }>;
    notes?: string;
    customer_email?: string;
    customer_discord?: string;
    special_instructions?: string;
  };
}

interface ServicesContextType {
  services: ServiceData[];
  loading: boolean;
  error: string | null;
  refreshServices: () => Promise<void>;
  addService: (
    service: Omit<Service, "id" | "created_at" | "updated_at">,
  ) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(
  undefined,
);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapService = (service: Service): ServiceData => ({
    id: service.id,
    title: service.title,
    description: service.description,
    price: Number(service.price),
    originalPrice: service.original_price
      ? Number(service.original_price)
      : undefined,
    duration: service.duration,
    difficulty: service.difficulty,
    features: service.features || [],
    active: service.active ?? true,
    popular: service.popular ?? false,
    category:
      (service.category as
        | "Level Boost"
        | "Medals"
        | "Samples"
        | "Super Credits"
        | "Promotions") || "Level Boost",
    createdAt: service.created_at || "",
    orders_count: service.orders_count || 0,
  });

  const refreshServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("services")
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
            "Services table not found - using demo data. Set up your Supabase database to persist real data.",
          );
          setServices([]); // Empty services array for demo
          setError(null);
          return;
        }
        throw fetchError;
      }

      const mappedServices = data?.map(mapService) || [];
      setServices(mappedServices);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      const errorMessage =
        err?.message || err?.error_description || "Failed to load services";

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

  const addService = async (
    serviceData: Omit<Service, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      const { error } = await supabase.from("services").insert([serviceData]);
      if (error) throw error;
      await refreshServices();
    } catch (err: any) {
      console.error("Error adding service:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to add service",
      );
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      await refreshServices();
    } catch (err: any) {
      console.error("Error updating service:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to update service",
      );
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      await refreshServices();
    } catch (err: any) {
      console.error("Error deleting service:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to delete service",
      );
    }
  };

  const toggleServiceStatus = async (id: string) => {
    try {
      const service = services.find((s) => s.id === id);
      if (!service) return;

      const { error } = await supabase
        .from("services")
        .update({ active: !service.active })
        .eq("id", id);

      if (error) throw error;
      await refreshServices();
    } catch (err: any) {
      console.error("Error toggling service status:", err);
      throw new Error(
        err?.message ||
          err?.error_description ||
          "Failed to toggle service status",
      );
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

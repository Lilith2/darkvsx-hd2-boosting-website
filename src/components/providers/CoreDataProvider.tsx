import React, { ReactNode, createContext, useContext, useMemo } from "react";
import { useServices, ServiceData, Service } from "@/hooks/useServices";
import { useBundles, BundleData, Bundle } from "@/hooks/useBundles";
import { OptimizedCartProvider, useOptimizedCart } from "@/hooks/useOptimizedCart";

interface CoreDataContextType {
  services: {
    services: ServiceData[];
    loading: boolean;
    refreshServices: () => Promise<void>;
    addService: (service: Omit<Service, "id" | "created_at" | "updated_at">) => Promise<void>;
    updateService: (id: string, updates: Partial<Service>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;
  };
  bundles: {
    bundles: BundleData[];
    loading: boolean;
    refreshBundles: () => Promise<void>;
    addBundle: (bundle: Omit<Bundle, "id" | "created_at" | "updated_at">) => Promise<void>;
    updateBundle: (id: string, updates: Partial<Bundle>) => Promise<void>;
    deleteBundle: (id: string) => Promise<void>;
  };
  cart: {
    items: any[];
    addItem: (service: ServiceData) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
  };
}

const CoreDataContext = createContext<CoreDataContextType | undefined>(undefined);

function CoreDataProviderInner({ children }: { children: ReactNode }) {
  const services = useServices();
  const bundles = useBundles();
  const cart = useOptimizedCart();

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    services: {
      services: services.services,
      loading: services.loading,
      refreshServices: services.refreshServices,
      addService: services.addService,
      updateService: services.updateService,
      deleteService: services.deleteService,
    },
    bundles: {
      bundles: bundles.bundles,
      loading: bundles.loading,
      refreshBundles: bundles.refreshBundles,
      addBundle: bundles.addBundle,
      updateBundle: bundles.updateBundle,
      deleteBundle: bundles.deleteBundle,
    },
    cart: {
      items: cart.items,
      addItem: cart.addItem,
      removeItem: cart.removeItem,
      updateQuantity: cart.updateQuantity,
      clearCart: cart.clearCart,
      total: cart.total,
      itemCount: cart.itemCount,
    },
  }), [services, bundles, cart]);

  return (
    <CoreDataContext.Provider value={contextValue}>
      {children}
    </CoreDataContext.Provider>
  );
}

export function CoreDataProvider({ children }: { children: ReactNode }) {
  return (
    <OptimizedCartProvider>
      <CoreDataProviderInner>
        {children}
      </CoreDataProviderInner>
    </OptimizedCartProvider>
  );
}

export function useCoreData() {
  const context = useContext(CoreDataContext);
  if (context === undefined) {
    throw new Error("useCoreData must be used within a CoreDataProvider");
  }
  return context;
}

// Individual hooks for backward compatibility and selective subscriptions
export function useServicesData() {
  const { services } = useCoreData();
  return services;
}

export function useBundlesData() {
  const { bundles } = useCoreData();
  return bundles;
}

export function useCartData() {
  const { cart } = useCoreData();
  return cart;
}

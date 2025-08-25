import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Query keys for organized cache management
export const adminQueryKeys = {
  all: ['admin'] as const,
  orders: () => [...adminQueryKeys.all, 'orders'] as const,
  customOrders: () => [...adminQueryKeys.all, 'customOrders'] as const,
  services: () => [...adminQueryKeys.all, 'services'] as const,
  bundles: () => [...adminQueryKeys.all, 'bundles'] as const,
  customPricing: () => [...adminQueryKeys.all, 'customPricing'] as const,
  analytics: () => [...adminQueryKeys.all, 'analytics'] as const,
};

// Fetch functions with error handling
const fetchOrders = async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
};

const fetchCustomOrders = async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("custom_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    throw new Error("Failed to fetch custom orders");
  }
};

const fetchServices = async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("title", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching services:", error);
    throw new Error("Failed to fetch services");
  }
};

const fetchBundles = async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("bundles")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching bundles:", error);
    throw new Error("Failed to fetch bundles");
  }
};

const fetchCustomPricing = async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("custom_pricing")
      .select("*")
      .order("category", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching custom pricing:", error);
    throw new Error("Failed to fetch custom pricing");
  }
};

// Main hook for optimized admin data management
export function useOptimizedAdminData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all data with React Query - optimized caching
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: adminQueryKeys.orders(),
    queryFn: fetchOrders,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const {
    data: customOrders = [],
    isLoading: customOrdersLoading,
    error: customOrdersError,
  } = useQuery({
    queryKey: adminQueryKeys.customOrders(),
    queryFn: fetchCustomOrders,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const {
    data: services = [],
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: adminQueryKeys.services(),
    queryFn: fetchServices,
    staleTime: 5 * 60 * 1000, // Services change less frequently
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const {
    data: bundles = [],
    isLoading: bundlesLoading,
    error: bundlesError,
  } = useQuery({
    queryKey: adminQueryKeys.bundles(),
    queryFn: fetchBundles,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const {
    data: customPricing = [],
    isLoading: customPricingLoading,
    error: customPricingError,
  } = useQuery({
    queryKey: adminQueryKeys.customPricing(),
    queryFn: fetchCustomPricing,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Update order status mutation with optimistic updates
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;
      return { orderId, status };
    },
    onMutate: async ({ orderId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.orders() });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData(adminQueryKeys.orders());

      // Optimistically update to the new value
      queryClient.setQueryData(adminQueryKeys.orders(), (old: any[]) => {
        return old?.map(order => 
          order.id === orderId ? { ...order, status } : order
        );
      });

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(adminQueryKeys.orders(), context?.previousOrders);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders() });
    },
  });

  // Real-time subscriptions for live updates
  useEffect(() => {
    let ordersSubscription: any;
    let servicesSubscription: any;
    let bundlesSubscription: any;
    let customOrdersSubscription: any;

    const setupSubscriptions = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");

        // Orders subscription
        ordersSubscription = supabase
          .channel("admin-orders")
          .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders() });
          })
          .subscribe();

        // Services subscription
        servicesSubscription = supabase
          .channel("admin-services")
          .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.services() });
          })
          .subscribe();

        // Bundles subscription
        bundlesSubscription = supabase
          .channel("admin-bundles")
          .on("postgres_changes", { event: "*", schema: "public", table: "bundles" }, () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.bundles() });
          })
          .subscribe();

        // Custom orders subscription
        customOrdersSubscription = supabase
          .channel("admin-custom-orders")
          .on("postgres_changes", { event: "*", schema: "public", table: "custom_orders" }, () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.customOrders() });
          })
          .subscribe();

      } catch (error) {
        console.error("Error setting up real-time subscriptions:", error);
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      if (ordersSubscription) ordersSubscription.unsubscribe();
      if (servicesSubscription) servicesSubscription.unsubscribe();
      if (bundlesSubscription) bundlesSubscription.unsubscribe();
      if (customOrdersSubscription) customOrdersSubscription.unsubscribe();
    };
  }, [queryClient]);

  // Calculate analytics data with memoization
  const analytics = useMemo(() => {
    const isLoading = ordersLoading || customOrdersLoading || servicesLoading;
    
    if (isLoading) {
      return {
        totalRevenue: 0,
        pendingOrdersCount: 0,
        activeServicesCount: 0,
        totalCustomersCount: 0,
        completedOrdersCount: 0,
        totalOrdersCount: 0,
        avgOrderValue: 0,
        isLoading: true,
      };
    }

    const allOrders = [...orders, ...customOrders];
    const totalRevenue = allOrders.reduce((sum, order) => {
      const amount = order.total_amount || (order as any).totalAmount || 0;
      return sum + amount;
    }, 0);

    const pendingOrdersCount = allOrders.filter(order => 
      order.status === "pending"
    ).length;

    const completedOrdersCount = allOrders.filter(order => 
      order.status === "completed"
    ).length;

    const activeServicesCount = services.filter(service => 
      service.active !== false
    ).length;

    // Extract unique customers
    const uniqueCustomers = new Set();
    allOrders.forEach(order => {
      const email = order.customer_email || (order as any).customerEmail;
      if (email) uniqueCustomers.add(email);
    });

    const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

    return {
      totalRevenue,
      pendingOrdersCount,
      activeServicesCount,
      totalCustomersCount: uniqueCustomers.size,
      completedOrdersCount,
      totalOrdersCount: allOrders.length,
      avgOrderValue,
      isLoading: false,
    };
  }, [orders, customOrders, services, ordersLoading, customOrdersLoading, servicesLoading]);

  // Invalidation functions for manual refresh
  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders() });
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.customOrders() });
  }, [queryClient]);

  const invalidateServices = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.services() });
  }, [queryClient]);

  const invalidateBundles = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.bundles() });
  }, [queryClient]);

  const invalidateCustomPricing = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.customPricing() });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
  }, [queryClient]);

  // Update order status with optimistic updates
  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  }, [updateOrderStatusMutation]);

  // Error aggregation
  const errors = {
    orders: ordersError?.message || null,
    customOrders: customOrdersError?.message || null,
    services: servicesError?.message || null,
    bundles: bundlesError?.message || null,
    customPricing: customPricingError?.message || null,
  };

  const hasErrors = Object.values(errors).some(error => error !== null);
  const isLoading = ordersLoading || customOrdersLoading || servicesLoading || bundlesLoading || customPricingLoading;

  return {
    // Data
    orders,
    customOrders,
    services,
    bundles,
    customPricing,
    analytics,

    // Loading states
    isLoading,
    ordersLoading,
    customOrdersLoading,
    servicesLoading,
    bundlesLoading,
    customPricingLoading,

    // Errors
    errors,
    hasErrors,

    // Actions
    updateOrderStatus,
    invalidateOrders,
    invalidateServices,
    invalidateBundles,
    invalidateCustomPricing,
    invalidateAll,

    // Mutation states
    isUpdatingOrderStatus: updateOrderStatusMutation.isPending,
  };
}

// Specialized hook for just order management (lighter weight)
export function useOptimizedOrdersOnly() {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: adminQueryKeys.orders(),
    queryFn: fetchOrders,
    staleTime: 1 * 60 * 1000, // 1 minute for active order management
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true, // More frequent updates for order management
  });

  const {
    data: customOrders = [],
    isLoading: customOrdersLoading,
    error: customOrdersError,
  } = useQuery({
    queryKey: adminQueryKeys.customOrders(),
    queryFn: fetchCustomOrders,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders() });
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.customOrders() });
  }, [queryClient]);

  return {
    orders,
    customOrders,
    isLoading: ordersLoading || customOrdersLoading,
    error: ordersError || customOrdersError,
    refresh,
  };
}

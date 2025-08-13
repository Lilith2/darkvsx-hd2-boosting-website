import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentIPAddress } from "./useIPAddress";
import type { Order, OrderMessage, OrderTracking } from "./useOrders";

// Query keys for better cache management
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...orderKeys.lists(), { filters }] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  messages: (orderId: string) =>
    [...orderKeys.all, "messages", orderId] as const,
  tracking: (orderId: string) =>
    [...orderKeys.all, "tracking", orderId] as const,
};

// Optimized orders hook with React Query
export function useOptimizedOrders() {
  const queryClient = useQueryClient();

  // Get all orders with optimized caching
  const {
    data: orders = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: orderKeys.lists(),
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        throw new Error(error.message);
      }

      return data?.map(mapOrderFromSupabase) || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Add order mutation
  const addOrderMutation = useMutation({
    mutationFn: async (
      orderData: Omit<Order, "id" | "created_at" | "updated_at">,
    ) => {
      const ipAddress = await getCurrentIPAddress();

      const { data, error } = await supabase
        .from("orders")
        .insert([{ ...orderData, ip_address: ipAddress }])
        .select()
        .single();

      if (error) throw error;
      return mapOrderFromSupabase(data);
    },
    onSuccess: (newOrder) => {
      queryClient.setQueryData<Order[]>(orderKeys.lists(), (old) =>
        old ? [newOrder, ...old] : [newOrder],
      );
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Order["status"];
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapOrderFromSupabase(data);
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData<Order[]>(
        orderKeys.lists(),
        (old) =>
          old?.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order,
          ) || [],
      );
    },
  });

  // Get order messages with caching
  const useOrderMessages = (orderId: string) => {
    return useQuery({
      queryKey: orderKeys.messages(orderId),
      queryFn: async (): Promise<OrderMessage[]> => {
        const { data, error } = await supabase
          .from("order_messages")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        return data?.map(mapOrderMessageFromSupabase) || [];
      },
      enabled: !!orderId,
      staleTime: 30 * 1000, // 30 seconds
    });
  };

  return {
    orders,
    loading,
    error: error?.message || null,
    addOrder: addOrderMutation.mutateAsync,
    updateOrderStatus: updateOrderStatusMutation.mutateAsync,
    useOrderMessages,
    // Expose query client for advanced cache management
    invalidateOrders: () =>
      queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  };
}

// Helper function to map Supabase data to Order interface
function mapOrderFromSupabase(data: any): Order {
  return {
    id: data.id,
    user_id: data.user_id,
    customer_email: data.customer_email,
    customer_name: data.customer_name,
    services: data.services || [],
    status: data.status,
    total_amount: data.total_amount,
    payment_status: data.payment_status,
    created_at: data.created_at,
    updated_at: data.updated_at,
    progress: data.progress,
    assigned_booster: data.assigned_booster,
    estimated_completion: data.estimated_completion,
    notes: data.notes,
    transaction_id: data.transaction_id,
    ip_address: data.ip_address,
    referral_code: data.referral_code,
    referral_discount: data.referral_discount,
    credits_used: data.credits_used,
  };
}

// Helper function to map Supabase data to OrderMessage interface
function mapOrderMessageFromSupabase(data: any): OrderMessage {
  return {
    id: data.id,
    order_id: data.order_id || "",
    from: data.from,
    message: data.message,
    is_read: data.is_read ?? false,
    created_at: data.created_at || new Date().toISOString(),
  };
}

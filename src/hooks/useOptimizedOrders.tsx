import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client-no-realtime";
import { useRequestDeduplication } from "./useRequestDeduplication";
import { OrderData, Order, OrderMessage, OrderTracking } from "./useOrders";

interface OrderFilters {
  status?: string;
  userId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  search?: string;
}

interface PaginationOptions {
  page: number;
  pageSize: number;
}

interface OptimizedOrdersContextType {
  orders: OrderData[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  filters: OrderFilters;

  // Methods
  fetchOrders: (options?: {
    filters?: OrderFilters;
    pagination?: PaginationOptions;
  }) => Promise<void>;
  setFilters: (filters: OrderFilters) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  getOrder: (orderId: string) => Promise<OrderData | null>;
  updateOrderStatus: (
    orderId: string,
    status: OrderData["status"],
  ) => Promise<void>;
  refreshCurrentPage: () => Promise<void>;
}

const OptimizedOrdersContext = createContext<
  OptimizedOrdersContextType | undefined
>(undefined);

export function OptimizedOrdersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [filters, setFiltersState] = useState<OrderFilters>({});

  const { dedupe } = useRequestDeduplication();

  // Transform database order to frontend format
  const transformOrder = (
    order: any,
    messages: OrderMessage[] = [],
    tracking: OrderTracking[] = [],
  ): OrderData => ({
    id: order.id,
    userId: order.user_id,
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    services: order.services,
    status: order.status,
    totalAmount: parseFloat(Number(order.total_amount).toFixed(2)),
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    progress: order.progress,
    assignedBooster: order.assigned_booster,
    estimatedCompletion: order.estimated_completion,
    notes: order.notes,
    transactionId: order.transaction_id || undefined,
    ipAddress: order.ip_address || undefined,
    referralCode: order.referral_code || undefined,
    referralDiscount: order.referral_discount || undefined,
    referralCreditsUsed: order.credits_used || undefined,
    referredByUserId: order.referred_by_user_id || undefined,
    messages: messages.map((msg: any) => ({
      id: msg.id,
      from: msg.from as "customer" | "admin" | "booster",
      message: msg.message,
      timestamp: msg.created_at || msg.timestamp,
      isRead: msg.is_read ?? msg.isRead ?? false,
    })),
    tracking: tracking.map((track: any) => ({
      status: track.status,
      timestamp: track.created_at || track.timestamp,
      description: track.description,
    })),
  });

  const buildQuery = (filters: OrderFilters, pagination: PaginationOptions) => {
    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters.dateRange) {
      query = query
        .gte("created_at", filters.dateRange.startDate)
        .lte("created_at", filters.dateRange.endDate);
    }

    if (filters.search) {
      // Search in customer email, customer name, and order ID
      query = query.or(
        `customer_email.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`,
      );
    }

    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);

    return query;
  };

  const fetchOrders = useCallback(
    async (options?: {
      filters?: OrderFilters;
      pagination?: PaginationOptions;
    }) => {
      const currentFilters = options?.filters || filters;
      const currentPagination = options?.pagination || {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
      };

      const requestKey = `orders:${JSON.stringify(currentFilters)}:${currentPagination.page}:${currentPagination.pageSize}`;

      try {
        await dedupe(requestKey, async () => {
          setLoading(true);
          setError(null);

          // Build and execute the optimized query
          const query = buildQuery(currentFilters, currentPagination);
          const { data: ordersData, error: ordersError, count } = await query;

          if (ordersError) {
            throw ordersError;
          }

          // Only fetch messages and tracking for the current page of orders
          const orderIds = ordersData?.map((order) => order.id) || [];

          let messages: OrderMessage[] = [];
          let tracking: OrderTracking[] = [];

          if (orderIds.length > 0) {
            const [messagesResult, trackingResult] = await Promise.all([
              supabase
                .from("order_messages")
                .select("*")
                .in("order_id", orderIds)
                .order("created_at", { ascending: true }),
              supabase
                .from("order_tracking")
                .select("*")
                .in("order_id", orderIds)
                .order("created_at", { ascending: true }),
            ]);

            messages = messagesResult.data || [];
            tracking = trackingResult.data || [];
          }

          // Transform orders with their related data
          const transformedOrders =
            ordersData?.map((order) => {
              const orderMessages = messages.filter(
                (msg) => msg.order_id === order.id,
              );
              const orderTracking = tracking.filter(
                (track) => track.order_id === order.id,
              );
              return transformOrder(order, orderMessages, orderTracking);
            }) || [];

          setOrders(transformedOrders);
          setPagination({
            currentPage: currentPagination.page,
            pageSize: currentPagination.pageSize,
            totalCount: count || 0,
            totalPages: Math.ceil((count || 0) / currentPagination.pageSize),
          });
        });
      } catch (err: any) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.currentPage, pagination.pageSize, dedupe],
  );

  const setFilters = useCallback((newFilters: OrderFilters) => {
    setFiltersState(newFilters);
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize,
      currentPage: 1, // Reset to first page when page size changes
    }));
  }, []);

  const getOrder = useCallback(
    async (orderId: string): Promise<OrderData | null> => {
      const requestKey = `order:${orderId}`;

      return dedupe(requestKey, async () => {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError || !orderData) {
          return null;
        }

        // Fetch messages and tracking for this specific order
        const [messagesResult, trackingResult] = await Promise.all([
          supabase
            .from("order_messages")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true }),
          supabase
            .from("order_tracking")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true }),
        ]);

        const messages = messagesResult.data || [];
        const tracking = trackingResult.data || [];

        return transformOrder(orderData, messages, tracking);
      });
    },
    [dedupe],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderData["status"]) => {
      try {
        const { error } = await supabase
          .from("orders")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (error) throw error;

        // Update the local state optimistically
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status, updatedAt: new Date().toISOString() }
              : order,
          ),
        );
      } catch (err: any) {
        console.error("Error updating order status:", err);
        throw err;
      }
    },
    [],
  );

  const refreshCurrentPage = useCallback(() => {
    return fetchOrders();
  }, [fetchOrders]);

  const contextValue = useMemo(
    () => ({
      orders,
      loading,
      error,
      pagination,
      filters,
      fetchOrders,
      setFilters,
      setPage,
      setPageSize,
      getOrder,
      updateOrderStatus,
      refreshCurrentPage,
    }),
    [
      orders,
      loading,
      error,
      pagination,
      filters,
      fetchOrders,
      setFilters,
      setPage,
      setPageSize,
      getOrder,
      updateOrderStatus,
      refreshCurrentPage,
    ],
  );

  return (
    <OptimizedOrdersContext.Provider value={contextValue}>
      {children}
    </OptimizedOrdersContext.Provider>
  );
}

export function useOptimizedOrders() {
  const context = useContext(OptimizedOrdersContext);
  if (context === undefined) {
    throw new Error(
      "useOptimizedOrders must be used within an OptimizedOrdersProvider",
    );
  }
  return context;
}

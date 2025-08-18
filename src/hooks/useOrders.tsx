import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client-no-realtime";
import { getCurrentIPAddress } from "./useIPAddress";

export interface Order {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name: string;
  services: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  status: "pending" | "processing" | "in-progress" | "completed" | "cancelled";
  total_amount: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
  progress?: number;
  assigned_booster?: string;
  estimated_completion?: string;
  notes?: string;
  transaction_id?: string;
  ip_address?: string;
  referral_code?: string;
  referral_discount?: number;
  credits_used?: number;
  referred_by_user_id?: string;
}

export interface OrderMessage {
  id: string;
  order_id: string | null;
  from: string;
  message: string;
  created_at: string | null;
  is_read: boolean | null;
}

export interface OrderTracking {
  id: string;
  order_id: string | null;
  status: string;
  description: string;
  created_at: string | null;
}

// Transformed interfaces for frontend
export interface OrderData {
  id: string;
  userId: string | null;
  customerEmail: string;
  customerName: string;
  services: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  status: "pending" | "processing" | "in-progress" | "completed" | "cancelled";
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  createdAt: string;
  updatedAt: string;
  progress?: number;
  assignedBooster?: string;
  estimatedCompletion?: string;
  notes?: string;
  transactionId?: string;
  ipAddress?: string;
  referralCode?: string;
  referralDiscount?: number;
  referralCreditsUsed?: number;
  referredByUserId?: string;
  messages: {
    id: string;
    from: "customer" | "admin" | "booster";
    message: string;
    timestamp: string;
    isRead: boolean;
  }[];
  tracking: {
    status: string;
    timestamp: string;
    description: string;
  }[];
}

interface OrdersContextType {
  orders: OrderData[];
  loading: boolean;
  error: string | null;
  addOrder: (
    order: Omit<
      OrderData,
      "id" | "createdAt" | "updatedAt" | "messages" | "tracking"
    >,
  ) => Promise<string>;
  getUserOrders: (userId: string) => OrderData[];
  getOrder: (orderId: string) => OrderData | undefined;
  updateOrderStatus: (
    orderId: string,
    status: OrderData["status"],
  ) => Promise<void>;
  addOrderMessage: (
    orderId: string,
    message: { from: "customer" | "admin" | "booster"; message: string },
  ) => Promise<void>;
  assignBooster: (orderId: string, boosterName: string) => Promise<void>;
  updateOrderProgress: (orderId: string, progress: number) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    referralDiscount: order.referral_discount
      ? parseFloat(Number(order.referral_discount).toFixed(2))
      : undefined,
    referralCreditsUsed: order.credits_used
      ? parseFloat(Number(order.credits_used).toFixed(2))
      : undefined,
    referredByUserId: undefined, // This column doesn't exist yet in the database
    messages: messages.map((msg) => ({
      id: msg.id,
      from: msg.from as "customer" | "admin" | "booster",
      message: msg.message,
      timestamp: msg.created_at,
      isRead: msg.is_read,
    })),
    tracking: tracking.map((track) => ({
      status: track.status,
      timestamp: track.created_at,
      description: track.description,
    })),
  });

  const refreshOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch orders with messages and tracking
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) {
        // Check if it's a table not found error (likely means database not set up)
        if (
          ordersError.code === "PGRST116" ||
          ordersError.message?.includes("relation") ||
          ordersError.message?.includes("does not exist")
        ) {
          console.warn(
            "Orders table not found - using demo data. Set up your Supabase database to persist real data.",
          );
          setOrders([]); // Empty orders array for demo
          setError(null);
          return;
        }
        throw ordersError;
      }

      // Fetch all messages and tracking for these orders
      const orderIds = ordersData?.map((order) => order.id) || [];

      const [messagesResult, trackingResult] = await Promise.all([
        supabase.from("order_messages").select("*").in("order_id", orderIds),
        supabase.from("order_tracking").select("*").in("order_id", orderIds),
      ]);

      const messages = (messagesResult.data || []).map(
        mapOrderMessageFromSupabase,
      );
      const tracking = (trackingResult.data || []).map(
        mapOrderTrackingFromSupabase,
      );

      // Transform and combine data
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
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      const errorMessage =
        err?.message || err?.error_description || "Failed to load orders";

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

  const addOrder = async (
    orderData: Omit<
      OrderData,
      "id" | "createdAt" | "updatedAt" | "messages" | "tracking"
    >,
  ): Promise<string> => {
    try {
      // Get user's IP address for chargeback protection
      const ipAddress = await getCurrentIPAddress();

      // Prepare the base order data
      const baseOrderData = {
        user_id: orderData.userId,
        customer_email: orderData.customerEmail,
        customer_name: orderData.customerName,
        services: orderData.services,
        status: orderData.status,
        total_amount: orderData.totalAmount,
        payment_status: orderData.paymentStatus,
        progress: orderData.progress,
        assigned_booster: orderData.assignedBooster,
        estimated_completion: orderData.estimatedCompletion,
        notes: orderData.notes,
      };

      // Add all optional fields that now exist in the database schema
      const insertData: any = { ...baseOrderData };

      // Add transaction ID for PayPal tracking
      if ((orderData as any).transactionId) {
        insertData.transaction_id = (orderData as any).transactionId;
      }

      // Add IP address for security/chargeback protection
      if (ipAddress) {
        insertData.ip_address = ipAddress;
      }

      // Add referral system fields
      if (orderData.referralCode) {
        insertData.referral_code = orderData.referralCode;
      }

      if (orderData.referralDiscount) {
        insertData.referral_discount = orderData.referralDiscount;
      }

      if (orderData.referralCreditsUsed) {
        insertData.credits_used = orderData.referralCreditsUsed;
      }

      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert([insertData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Add initial tracking entry - this might be failing if table doesn't exist
      try {
        await supabase.from("order_tracking").insert([
          {
            order_id: orderResult.id,
            status: "Order Placed",
            description: "Your order has been received and is being processed",
          },
        ]);
      } catch (trackingError) {
        console.warn(
          "Failed to add order tracking (table might not exist):",
          trackingError,
        );
        // Continue without tracking if table doesn't exist
      }

      await refreshOrders();
      return orderResult.id;
    } catch (err: any) {
      console.error("Error adding order:", err);

      // Handle specific database schema errors
      if (
        err?.message?.includes("column") &&
        (err?.message?.includes("transaction_id") ||
          err?.message?.includes("referral_code") ||
          err?.message?.includes("referral_discount") ||
          err?.message?.includes("credits_used"))
      ) {
        console.warn(
          "Database schema missing some expected columns. Retrying with base fields only.",
        );
        // Try again without the optional fields
        try {
          const retryOrderData: any = {
            user_id: orderData.userId,
            customer_email: orderData.customerEmail,
            customer_name: orderData.customerName,
            services: orderData.services,
            status: orderData.status,
            total_amount: orderData.totalAmount,
            payment_status: orderData.paymentStatus,
            progress: orderData.progress,
            assigned_booster: orderData.assignedBooster,
            estimated_completion: orderData.estimatedCompletion,
            notes: orderData.notes,
          };

          // Add optional fields for retry as well
          if (orderData.transactionId) {
            retryOrderData.transaction_id = orderData.transactionId;
          }
          if (orderData.referralCode) {
            retryOrderData.referral_code = orderData.referralCode;
          }
          if (orderData.referralDiscount) {
            retryOrderData.referral_discount = orderData.referralDiscount;
          }
          if (orderData.referralCreditsUsed) {
            retryOrderData.credits_used = orderData.referralCreditsUsed;
          }

          const { data: orderResult, error: orderError } = await supabase
            .from("orders")
            .insert([retryOrderData])
            .select()
            .single();

          if (orderError) throw orderError;

          // Add initial tracking entry
          await supabase.from("order_tracking").insert([
            {
              order_id: orderResult.id,
              status: "Order Placed",
              description:
                "Your order has been received and is being processed",
            },
          ]);

          await refreshOrders();
          return orderResult.id;
        } catch (retryErr: any) {
          console.error("Error on retry:", retryErr);
          throw new Error(
            retryErr?.message ||
              retryErr?.error_description ||
              "Failed to add order after retry",
          );
        }
      }

      const errorMessage =
        err?.message ||
        err?.error_description ||
        JSON.stringify(err) ||
        "Failed to add order";
      throw new Error(`Database error: ${errorMessage}`);
    }
  };

  const getUserOrders = (userId: string): OrderData[] => {
    return orders.filter((order) => order.userId === userId);
  };

  const getOrder = (orderId: string): OrderData | undefined => {
    return orders.find((order) => order.id === orderId);
  };

  const updateOrderStatus = async (
    orderId: string,
    status: OrderData["status"],
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      // Add tracking entry for status change
      await supabase.from("order_tracking").insert([
        {
          order_id: orderId,
          status: `Status changed to ${status}`,
          description: `Order status has been updated to ${status}`,
        },
      ]);

      await refreshOrders();
    } catch (err: any) {
      console.error("Error updating order status:", err);
      throw new Error(
        err?.message ||
          err?.error_description ||
          "Failed to update order status",
      );
    }
  };

  const addOrderMessage = async (
    orderId: string,
    messageData: { from: "customer" | "admin" | "booster"; message: string },
  ) => {
    try {
      const { error } = await supabase.from("order_messages").insert([
        {
          order_id: orderId,
          from: messageData.from,
          message: messageData.message,
          is_read: false,
        },
      ]);

      if (error) throw error;

      await refreshOrders();
    } catch (err: any) {
      console.error("Error adding order message:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to add order message",
      );
    }
  };

  const assignBooster = async (orderId: string, boosterName: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          assigned_booster: boosterName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Add tracking entry
      await supabase.from("order_tracking").insert([
        {
          order_id: orderId,
          status: "Booster Assigned",
          description: `${boosterName} has been assigned to your order`,
        },
      ]);

      await refreshOrders();
    } catch (err: any) {
      console.error("Error assigning booster:", err);
      throw new Error(
        err?.message || err?.error_description || "Failed to assign booster",
      );
    }
  };

  const updateOrderProgress = async (orderId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          progress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await refreshOrders();
    } catch (err: any) {
      console.error("Error updating order progress:", err);
      throw new Error(
        err?.message ||
          err?.error_description ||
          "Failed to update order progress",
      );
    }
  };

  useEffect(() => {
    refreshOrders();
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        loading,
        error,
        addOrder,
        getUserOrders,
        getOrder,
        updateOrderStatus,
        addOrderMessage,
        assignBooster,
        updateOrderProgress,
        refreshOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
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

// Helper function to map Supabase data to OrderTracking interface
function mapOrderTrackingFromSupabase(data: any): OrderTracking {
  return {
    id: data.id,
    order_id: data.order_id || "",
    status: data.status,
    description: data.description,
    created_at: data.created_at || new Date().toISOString(),
  };
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}

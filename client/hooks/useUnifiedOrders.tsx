import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Enhanced order interface for the unified system
export interface UnifiedOrder {
  id: string;
  order_number: string;
  order_type: 'standard' | 'custom' | 'bundle';
  user_id?: string;
  customer_email: string;
  customer_name: string;
  customer_discord?: string;
  items: any[];
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  credits_used: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled';
  progress: number;
  estimated_completion_hours?: number;
  actual_completion_time?: string;
  transaction_id?: string;
  payment_method?: string;
  ip_address?: string;
  referral_code?: string;
  referral_discount: number;
  notes?: string;
  special_instructions?: string;
  admin_notes?: string;
  metadata: Record<string, any>;
  tags: string[];
  status_history: any[];
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  deleted_at?: string;
}

export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  avg_order_value: number;
  fulfillment_rate: number;
}

interface UnifiedOrdersContextType {
  orders: UnifiedOrder[];
  stats: OrderStats;
  loading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  createOrder: (orderData: Partial<UnifiedOrder>) => Promise<string>;
  updateOrder: (orderId: string, updates: Partial<UnifiedOrder>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: UnifiedOrder['status']) => Promise<void>;
  addOrderNote: (orderId: string, note: string, isAdmin?: boolean) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  getOrderById: (orderId: string) => Promise<UnifiedOrder | null>;
  getOrdersByUser: (userId: string) => Promise<UnifiedOrder[]>;
}

const UnifiedOrdersContext = createContext<UnifiedOrdersContextType | undefined>(undefined);

export function UnifiedOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_revenue: 0,
    avg_order_value: 0,
    fulfillment_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch orders from the unified orders table
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("unified_orders")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const transformedOrders: UnifiedOrder[] = (data || []).map((order: any) => ({
        ...order,
        items: order.items || [],
        metadata: order.metadata || {},
        tags: order.tags || [],
        status_history: order.status_history || [],
      }));

      setOrders(transformedOrders);
    } catch (err: any) {
      console.error("Error fetching unified orders:", err?.message || err);
      setError(err?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // Calculate order statistics
  const calculateStats = async () => {
    try {
      const { data, error: statsError } = await supabase
        .from("unified_orders")
        .select("status, total_amount, created_at, completed_at")
        .is("deleted_at", null);

      if (statsError) {
        throw statsError;
      }

      const totalOrders = data?.length || 0;
      const pendingOrders = data?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = data?.filter(o => o.status === 'completed').length || 0;
      const totalRevenue = data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const fulfillmentRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      setStats({
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        completed_orders: completedOrders,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        fulfillment_rate: fulfillmentRate,
      });
    } catch (err: any) {
      console.error("Error calculating order stats:", err);
    }
  };

  // Create a new order
  const createOrder = async (orderData: Partial<UnifiedOrder>): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from("unified_orders")
        .insert([{
          ...orderData,
          status: orderData.status || 'pending',
          payment_status: orderData.payment_status || 'pending',
          fulfillment_status: orderData.fulfillment_status || 'unfulfilled',
          subtotal_amount: orderData.subtotal_amount || 0,
          tax_amount: orderData.tax_amount || 0,
          discount_amount: orderData.discount_amount || 0,
          credits_used: orderData.credits_used || 0,
          total_amount: orderData.total_amount || 0,
          currency: orderData.currency || 'USD',
          progress: orderData.progress || 0,
          referral_discount: orderData.referral_discount || 0,
          items: orderData.items || [],
          metadata: orderData.metadata || {},
          tags: orderData.tags || [],
          status_history: [{
            status: orderData.status || 'pending',
            timestamp: new Date().toISOString(),
            note: 'Order created'
          }],
        }])
        .select()
        .single();

      if (error) throw error;

      await refreshOrders();
      return data.id;
    } catch (err: any) {
      console.error("Error creating order:", err);
      throw new Error(err?.message || "Failed to create order");
    }
  };

  // Update an existing order
  const updateOrder = async (orderId: string, updates: Partial<UnifiedOrder>) => {
    try {
      const { error } = await supabase
        .from("unified_orders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await refreshOrders();
    } catch (err: any) {
      console.error("Error updating order:", err);
      throw new Error(err?.message || "Failed to update order");
    }
  };

  // Update order status with history tracking
  const updateOrderStatus = async (orderId: string, status: UnifiedOrder['status']) => {
    try {
      // Get current order to update status history
      const { data: currentOrder, error: fetchError } = await supabase
        .from("unified_orders")
        .select("status_history")
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;

      const statusHistory = currentOrder?.status_history || [];
      statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        note: `Status updated to ${status}`,
      });

      const updates: any = {
        status,
        status_history: statusHistory,
        updated_at: new Date().toISOString(),
      };

      // Set completion timestamp for completed orders
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.fulfillment_status = 'fulfilled';
        updates.progress = 100;
      }

      const { error } = await supabase
        .from("unified_orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      await refreshOrders();
    } catch (err: any) {
      console.error("Error updating order status:", err);
      throw new Error(err?.message || "Failed to update order status");
    }
  };

  // Add a note to an order
  const addOrderNote = async (orderId: string, note: string, isAdmin = false) => {
    try {
      const field = isAdmin ? 'admin_notes' : 'notes';
      
      const { error } = await supabase
        .from("unified_orders")
        .update({
          [field]: note,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await refreshOrders();
    } catch (err: any) {
      console.error("Error adding order note:", err);
      throw new Error(err?.message || "Failed to add note");
    }
  };

  // Soft delete an order
  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("unified_orders")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await refreshOrders();
    } catch (err: any) {
      console.error("Error deleting order:", err);
      throw new Error(err?.message || "Failed to delete order");
    }
  };

  // Get a specific order by ID
  const getOrderById = async (orderId: string): Promise<UnifiedOrder | null> => {
    try {
      const { data, error } = await supabase
        .from("unified_orders")
        .select("*")
        .eq("id", orderId)
        .is("deleted_at", null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        ...data,
        items: data.items || [],
        metadata: data.metadata || {},
        tags: data.tags || [],
        status_history: data.status_history || [],
      };
    } catch (err: any) {
      console.error("Error fetching order by ID:", err);
      throw new Error(err?.message || "Failed to fetch order");
    }
  };

  // Get orders by user ID
  const getOrdersByUser = async (userId: string): Promise<UnifiedOrder[]> => {
    try {
      const { data, error } = await supabase
        .from("unified_orders")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((order: any) => ({
        ...order,
        items: order.items || [],
        metadata: order.metadata || {},
        tags: order.tags || [],
        status_history: order.status_history || [],
      }));
    } catch (err: any) {
      console.error("Error fetching user orders:", err);
      throw new Error(err?.message || "Failed to fetch user orders");
    }
  };

  // Refresh orders and stats
  const refreshOrders = async () => {
    await Promise.all([fetchOrders(), calculateStats()]);
  };

  // Initialize data
  useEffect(() => {
    refreshOrders();
  }, []);

  const contextValue: UnifiedOrdersContextType = {
    orders,
    stats,
    loading,
    error,
    refreshOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    addOrderNote,
    deleteOrder,
    getOrderById,
    getOrdersByUser,
  };

  return (
    <UnifiedOrdersContext.Provider value={contextValue}>
      {children}
    </UnifiedOrdersContext.Provider>
  );
}

export function useUnifiedOrders() {
  const context = useContext(UnifiedOrdersContext);
  if (context === undefined) {
    throw new Error("useUnifiedOrders must be used within a UnifiedOrdersProvider");
  }
  return context;
}

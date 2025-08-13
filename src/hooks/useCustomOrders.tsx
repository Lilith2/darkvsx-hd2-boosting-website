import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomOrderItem {
  id: string;
  category: string;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  description: string;
}

export interface CustomOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  total_amount: number;
  currency: string;
  items: CustomOrderItem[];
  special_instructions?: string;
  customer_email?: string;
  customer_discord?: string;
  payment_intent_id?: string;
  delivery_status: "not_started" | "in_progress" | "completed" | "failed";
  delivery_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CustomOrderStats {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  pending_orders: number;
  completed_orders: number;
  most_popular_category?: string;
}

export function useCustomOrders() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [stats, setStats] = useState<CustomOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch custom orders - using dynamic query to avoid type errors
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("custom_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform the data to match our interface
      const transformedOrders: CustomOrder[] = (data || []).map(
        (order: any) => ({
          ...order,
          items: order.items || [], // Use items from the jsonb column
        }),
      );

      setOrders(transformedOrders);
    } catch (err: any) {
      console.error("Error fetching custom orders:", err?.message || err);
      setError(err?.message || "Failed to fetch custom orders");
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics
  const fetchStats = async () => {
    try {
      // Try using the stored function first
      const { data, error: statsError } = await supabase.rpc(
        "get_custom_order_stats",
      );

      if (statsError) {
        // If function doesn't exist, calculate stats manually
        console.log("Stats function not available, calculating manually...");
        await calculateStatsManually();
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err: any) {
      console.error("Error fetching order stats:", err);
      // Try manual calculation as fallback
      await calculateStatsManually();
    }
  };

  // Manual stats calculation as fallback
  const calculateStatsManually = async () => {
    try {
      const { data: allOrders, error } = await supabase
        .from("custom_orders")
        .select("*");

      if (error) {
        console.error("Error in manual stats calculation:", error);
        return;
      }

      const orders = allOrders || [];
      const stats: CustomOrderStats = {
        total_orders: orders.length,
        total_revenue: orders.reduce(
          (sum: number, order: any) => sum + (order.total_amount || 0),
          0,
        ),
        avg_order_value:
          orders.length > 0
            ? orders.reduce(
                (sum: number, order: any) => sum + (order.total_amount || 0),
                0,
              ) / orders.length
            : 0,
        pending_orders: orders.filter(
          (order: any) => order.status === "pending",
        ).length,
        completed_orders: orders.filter(
          (order: any) => order.status === "completed",
        ).length,
      };

      setStats(stats);
    } catch (err: any) {
      console.error("Error in manual stats calculation:", err);
    }
  };

  // Create a new custom order
  const createOrder = async (orderData: {
    items: Array<{
      category: string;
      item_name: string;
      quantity: number;
      price_per_unit: number;
      total_price: number;
      description: string;
    }>;
    special_instructions?: string;
    customer_email?: string;
    customer_discord?: string;
  }) => {
    try {
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );

      // Create the main order
      const { data: orderResult, error: orderError } = await supabase
        .from("custom_orders")
        .insert({
          total_amount: totalAmount,
          special_instructions: orderData.special_instructions,
          customer_email: orderData.customer_email,
          customer_discord: orderData.customer_discord,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = orderData.items.map((item) => ({
        order_id: (orderResult as any).id,
        ...item,
      }));

      const { error: itemsError } = await supabase
        .from("custom_order_items" as any)
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      toast({
        title: "Order Created",
        description: `Custom order ${(orderResult as any).order_number || (orderResult as any).id} has been created successfully.`,
      });

      // Refresh orders
      await fetchOrders();
      await fetchStats();

      return orderResult;
    } catch (err: any) {
      console.error("Error creating custom order:", err);
      const errorMessage =
        err?.message ||
        err?.error_description ||
        JSON.stringify(err) ||
        "Failed to create custom order";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Update order status
  const updateOrderStatus = async (
    orderId: string,
    status: CustomOrder["status"],
  ) => {
    try {
      const { error } = await supabase
        .from("custom_orders" as any)
        .update({ status })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Order status has been updated to ${status}.`,
      });

      // Refresh orders
      await fetchOrders();
      await fetchStats();
    } catch (err: any) {
      console.error("Error updating order status:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Update delivery status
  const updateDeliveryStatus = async (
    orderId: string,
    deliveryStatus: CustomOrder["delivery_status"],
    notes?: string,
  ) => {
    try {
      const updates: any = { delivery_status: deliveryStatus };
      if (notes !== undefined) {
        updates.delivery_notes = notes;
      }

      const { error } = await supabase
        .from("custom_orders" as any)
        .update(updates)
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Delivery Status Updated",
        description: `Delivery status has been updated to ${deliveryStatus.replace("_", " ")}.`,
      });

      // Refresh orders
      await fetchOrders();
      await fetchStats();
    } catch (err: any) {
      console.error("Error updating delivery status:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update delivery status",
        variant: "destructive",
      });
    }
  };

  // Add admin notes
  const updateAdminNotes = async (orderId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("custom_orders" as any)
        .update({ admin_notes: notes })
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Notes Updated",
        description: "Admin notes have been updated successfully.",
      });

      // Refresh orders
      await fetchOrders();
    } catch (err: any) {
      console.error("Error updating admin notes:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update admin notes",
        variant: "destructive",
      });
    }
  };

  // Delete order (admin only)
  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("custom_orders" as any)
        .delete()
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Order Deleted",
        description: "Custom order has been deleted successfully.",
      });

      // Refresh orders
      await fetchOrders();
      await fetchStats();
    } catch (err: any) {
      console.error("Error deleting order:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel("custom_orders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "custom_orders" as any,
        },
        () => {
          fetchOrders();
          fetchStats();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    orders,
    stats,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    updateDeliveryStatus,
    updateAdminNotes,
    deleteOrder,
    refetch: () => {
      fetchOrders();
      fetchStats();
    },
  };
}

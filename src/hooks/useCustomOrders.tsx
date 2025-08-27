import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client-no-realtime";
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
  customer_name?: string;
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

      // First try to fetch orders with items from the JSONB column
      const { data, error: fetchError } = await supabase
        .from("custom_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform the data to match our interface and handle items properly
      const transformedOrders: CustomOrder[] = [];

      for (const order of data || []) {
        let orderItems: any[] = [];

        // Check if items are stored in the JSONB column
        if (
          order.items &&
          Array.isArray(order.items) &&
          order.items.length > 0
        ) {
          orderItems = order.items;
        } else {
          // Fallback: try to fetch from custom_order_items table
          try {
            const { data: itemsData } = await supabase
              .from("custom_order_items")
              .select("*")
              .eq("order_id", order.id);

            orderItems = (itemsData || []).map((item: any) => ({
              id: item.id,
              category: item.category,
              item_name: item.item_name,
              quantity: item.quantity,
              price_per_unit: parseFloat(item.price_per_unit),
              total_price: parseFloat(item.total_price),
              description: item.description || "",
            }));
          } catch (itemsError) {
            console.warn(
              "Could not fetch items for order:",
              order.id,
              itemsError,
            );
            orderItems = [];
          }
        }

        transformedOrders.push({
          ...order,
          user_id: order.user_id || undefined,
          items: orderItems,
        } as any);
      }

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

      if (data && data.length > 0 && data[0]) {
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
    customer_name?: string;
    customer_discord?: string;
    referralCode?: string;
    referralDiscount?: number;
    userId?: string | null;
    paymentIntentId?: string; // Add support for payment_intent_id
  }) => {
    try {
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );

      // Create the main order
      const customOrderData: any = {
        user_id: orderData.userId,
        total_amount: parseFloat(totalAmount.toFixed(2)), // Fix precision
        items: orderData.items, // Store items in JSONB column
        special_instructions: orderData.special_instructions,
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        customer_discord: orderData.customer_discord,
        currency: "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add payment information if provided (use both for compatibility)
      if (orderData.paymentIntentId) {
        customOrderData.payment_intent_id = orderData.paymentIntentId;
        customOrderData.transaction_id = orderData.paymentIntentId; // Keep both for compatibility
      }

      // Add referral information if provided
      if (orderData.referralCode) {
        customOrderData.referral_code = orderData.referralCode;
        customOrderData.referral_discount = orderData.referralDiscount
          ? parseFloat(orderData.referralDiscount.toFixed(2))
          : 0;
      }

      const { data: orderResult, error: orderError } = await supabase
        .from("custom_orders")
        .insert(customOrderData)
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = orderData.items.map((item) => ({
        order_id: orderResult.id,
        ...item,
      }));

      const { error: itemsError } = await supabase
        .from("custom_order_items")
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      toast({
        title: "Order Created",
        description: `Custom order ${orderResult.order_number || orderResult.id} has been created successfully.`,
      });

      // Refresh orders
      await fetchOrders();
      await fetchStats();

      return orderResult;
    } catch (err: any) {
      console.error("Error creating custom order:", err);

      // Properly extract error message from different error types
      let errorMessage = "Failed to create custom order";

      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      } else if (err?.details) {
        errorMessage = err.details;
      } else if (err?.hint) {
        errorMessage = err.hint;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err?.code) {
        errorMessage = `Database error (${err.code}): ${err.message || "Unknown error"}`;
      }

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
        .from("custom_orders")
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
        .from("custom_orders")
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
        .from("custom_orders")
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
        .from("custom_orders")
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
          table: "custom_orders",
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

  // Function to get custom orders for a specific user
  const getUserCustomOrders = (userId: string): CustomOrder[] => {
    return orders.filter((order) => order.user_id === userId);
  };

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
    getUserCustomOrders,
    refetch: () => {
      fetchOrders();
      fetchStats();
    },
  };
}

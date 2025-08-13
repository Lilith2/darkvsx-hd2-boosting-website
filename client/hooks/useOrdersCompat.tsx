import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUnifiedOrders } from './useUnifiedOrders';
import { getCurrentIPAddress } from './useIPAddress';

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
  order_id: string;
  from: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: string;
  description: string;
  created_at: string;
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
  addOrder: (order: Omit<OrderData, "id" | "createdAt" | "updatedAt" | "messages" | "tracking">) => Promise<string>;
  getUserOrders: (userId: string) => OrderData[];
  getOrder: (orderId: string) => OrderData | undefined;
  updateOrderStatus: (orderId: string, status: OrderData["status"]) => Promise<void>;
  addOrderMessage: (orderId: string, message: { from: "customer" | "admin" | "booster"; message: string }) => Promise<void>;
  updateOrderProgress: (orderId: string, progress: number) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { 
    orders: unifiedOrders, 
    loading, 
    error, 
    createOrder,
    updateOrder,
    updateOrderStatus as updateUnifiedOrderStatus,
    addOrderNote,
    getOrdersByUser,
    refreshOrders: refreshUnifiedOrders
  } = useUnifiedOrders();
  
  const [orders, setOrders] = useState<OrderData[]>([]);

  // Transform unified orders to legacy format
  const transformUnifiedToLegacy = (unifiedOrder: any): OrderData => ({
    id: unifiedOrder.id,
    userId: unifiedOrder.customer_id,
    customerEmail: unifiedOrder.customer_email || '',
    customerName: unifiedOrder.customer_name || '',
    services: Array.isArray(unifiedOrder.items) ? unifiedOrder.items.map((item: any) => ({
      id: item.product_id || item.id || '',
      name: item.product_name || item.name || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
    })) : [],
    status: unifiedOrder.status,
    totalAmount: unifiedOrder.total_amount || 0,
    paymentStatus: unifiedOrder.payment_status,
    createdAt: unifiedOrder.created_at,
    updatedAt: unifiedOrder.updated_at,
    progress: unifiedOrder.progress,
    assignedBooster: unifiedOrder.assigned_to,
    estimatedCompletion: unifiedOrder.estimated_completion,
    notes: unifiedOrder.notes,
    transactionId: unifiedOrder.payment_reference,
    ipAddress: unifiedOrder.metadata?.ip_address,
    referralCode: unifiedOrder.metadata?.referral_code,
    referralDiscount: unifiedOrder.metadata?.referral_discount,
    referralCreditsUsed: unifiedOrder.metadata?.credits_used,
    referredByUserId: unifiedOrder.metadata?.referred_by_user_id,
    messages: [], // Would need to be implemented with communications system
    tracking: [], // Would need to be implemented with activity tracking
  });

  // Transform legacy to unified format
  const transformLegacyToUnified = (legacyOrder: Omit<OrderData, "id" | "createdAt" | "updatedAt" | "messages" | "tracking">) => ({
    customer_id: legacyOrder.userId,
    customer_email: legacyOrder.customerEmail,
    customer_name: legacyOrder.customerName,
    status: legacyOrder.status,
    payment_status: legacyOrder.paymentStatus,
    total_amount: legacyOrder.totalAmount,
    items: legacyOrder.services.map(service => ({
      product_id: service.id,
      product_name: service.name,
      quantity: service.quantity,
      price: service.price,
      total_price: service.price * service.quantity,
    })),
    progress: legacyOrder.progress,
    assigned_to: legacyOrder.assignedBooster,
    estimated_completion: legacyOrder.estimatedCompletion,
    notes: legacyOrder.notes,
    payment_reference: legacyOrder.transactionId,
    metadata: {
      ip_address: legacyOrder.ipAddress,
      referral_code: legacyOrder.referralCode,
      referral_discount: legacyOrder.referralDiscount,
      credits_used: legacyOrder.referralCreditsUsed,
      referred_by_user_id: legacyOrder.referredByUserId,
    },
  });

  const refreshOrders = async () => {
    try {
      await refreshUnifiedOrders();
      const transformedOrders = unifiedOrders.map(transformUnifiedToLegacy);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  };

  const addOrder = async (orderData: Omit<OrderData, "id" | "createdAt" | "updatedAt" | "messages" | "tracking">): Promise<string> => {
    try {
      // Get IP address for security
      const ipAddress = await getCurrentIPAddress();
      
      const unifiedOrderData = {
        ...transformLegacyToUnified(orderData),
        metadata: {
          ...transformLegacyToUnified(orderData).metadata,
          ip_address: ipAddress,
        },
      };

      const orderId = await createOrder(unifiedOrderData);
      await refreshOrders();
      return orderId;
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  };

  const getUserOrders = (userId: string): OrderData[] => {
    return orders.filter(order => order.userId === userId);
  };

  const getOrder = (orderId: string): OrderData | undefined => {
    return orders.find(order => order.id === orderId);
  };

  const updateOrderStatus = async (orderId: string, status: OrderData["status"]) => {
    try {
      await updateUnifiedOrderStatus(orderId, status);
      await refreshOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const addOrderMessage = async (orderId: string, messageData: { from: "customer" | "admin" | "booster"; message: string }) => {
    try {
      await addOrderNote(orderId, messageData.message);
      await refreshOrders();
    } catch (error) {
      console.error('Error adding order message:', error);
      throw error;
    }
  };

  const updateOrderProgress = async (orderId: string, progress: number) => {
    try {
      await updateOrder(orderId, { progress });
      await refreshOrders();
    } catch (error) {
      console.error('Error updating order progress:', error);
      throw error;
    }
  };

  // Update orders when unified orders change
  useEffect(() => {
    const transformedOrders = unifiedOrders.map(transformUnifiedToLegacy);
    setOrders(transformedOrders);
  }, [unifiedOrders]);

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
        updateOrderProgress,
        refreshOrders,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}
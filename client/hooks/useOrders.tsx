import { createContext, useContext, useState, ReactNode } from "react";

export interface Order {
  id: string;
  userId: string;
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
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "createdAt" | "updatedAt" | "messages" | "tracking">) => string;
  getUserOrders: (userId: string) => Order[];
  getOrder: (orderId: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const addOrder = (orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "messages" | "tracking">): string => {
    const orderId = `ORD-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      tracking: [
        {
          status: "Order Placed",
          timestamp: new Date().toISOString(),
          description: "Your order has been received and is being processed",
        },
      ],
    };

    setOrders((prev) => [...prev, newOrder]);
    return orderId;
  };

  const getUserOrders = (userId: string): Order[] => {
    return orders.filter((order) => order.userId === userId);
  };

  const getOrder = (orderId: string): Order | undefined => {
    return orders.find((order) => order.id === orderId);
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        getUserOrders,
        getOrder,
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

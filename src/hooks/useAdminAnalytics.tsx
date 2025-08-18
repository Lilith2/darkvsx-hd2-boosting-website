import { useState, useEffect, useMemo } from "react";
import { Order, CustomOrder } from "@/lib/types";

interface Service {
  id: string;
  name: string;
  active: boolean;
}

interface UseAdminAnalyticsProps {
  orders: Order[];
  customOrders: CustomOrder[];
  services?: Service[];
  loading: boolean;
  customOrdersLoading: boolean;
}

interface AdminAnalytics {
  totalRevenue: number;
  pendingOrdersCount: number;
  activeServicesCount: number;
  totalCustomersCount: number;
  recentOrders: (Order | CustomOrder)[];
  topServices: Array<{
    id: string;
    name: string;
    revenue: number;
    orderCount: number;
  }>;
  isLoading: boolean;
}

export function useAdminAnalytics({
  orders,
  customOrders,
  services = [],
  loading,
  customOrdersLoading,
}: UseAdminAnalyticsProps): AdminAnalytics {
  const [analytics, setAnalytics] = useState<AdminAnalytics>({
    totalRevenue: 0,
    pendingOrdersCount: 0,
    activeServicesCount: 0,
    totalCustomersCount: 0,
    recentOrders: [],
    topServices: [],
    isLoading: true,
  });

  const isLoading = loading || customOrdersLoading;

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (isLoading) {
      return {
        totalRevenue: 0,
        pendingOrdersCount: 0,
        activeServicesCount: 0,
        totalCustomersCount: 0,
        recentOrders: [],
        topServices: [],
        isLoading: true,
      };
    }

    // Calculate total revenue
    const regularRevenue = orders.reduce((total, order) => {
      return total + (order.total_amount || 0);
    }, 0);

    const customRevenue = customOrders.reduce((total, order) => {
      return total + (order.total_amount || 0);
    }, 0);

    const totalRevenue = regularRevenue + customRevenue;

    // Count pending orders
    const pendingRegularOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const pendingCustomOrders = customOrders.filter(
      (order) => order.status === "pending"
    ).length;
    const pendingOrdersCount = pendingRegularOrders + pendingCustomOrders;

    // Count active services
    const activeServicesCount = services.filter((service) => service.active).length;

    // Count unique customers
    const customerEmails = new Set<string>();
    orders.forEach((order) => {
      if ((order as any).customer_email) {
        customerEmails.add((order as any).customer_email);
      }
    });
    customOrders.forEach((order) => {
      if (order.customer_email) {
        customerEmails.add(order.customer_email);
      }
    });
    const totalCustomersCount = customerEmails.size;

    // Get recent orders (last 5)
    const allOrders = [
      ...orders.map((order) => ({ ...order, type: "regular" as const })),
      ...customOrders.map((order) => ({ ...order, type: "custom" as const })),
    ];

    const recentOrders = allOrders
      .sort((a, b) => {
        const dateA = new Date(
          ("createdAt" in a ? (a as any).createdAt : (a as any).created_at) || new Date()
        ).getTime();
        const dateB = new Date(
          ("createdAt" in b ? (b as any).createdAt : (b as any).created_at) || new Date()
        ).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    // Calculate top services by revenue
    const serviceRevenue = new Map<string, { name: string; revenue: number; orderCount: number }>();

    orders.forEach((order) => {
      if (order.services) {
        order.services.forEach((service) => {
          const current = serviceRevenue.get(service.id) || {
            name: service.name,
            revenue: 0,
            orderCount: 0,
          };
          serviceRevenue.set(service.id, {
            name: service.name,
            revenue: current.revenue + (service.price * service.quantity),
            orderCount: current.orderCount + 1,
          });
        });
      }
    });

    const topServices = Array.from(serviceRevenue.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      pendingOrdersCount,
      activeServicesCount,
      totalCustomersCount,
      recentOrders,
      topServices,
      isLoading: false,
    };
  }, [orders, customOrders, isLoading]);

  useEffect(() => {
    setAnalytics(analyticsData);
  }, [analyticsData]);

  return analytics;
}

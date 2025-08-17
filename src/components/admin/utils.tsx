import { useMemo } from "react";

// Shared order interface
export interface Order {
  id: string;
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  status: string;
  total_amount?: number;
  totalAmount?: number;
  created_at?: string;
  createdAt?: string;
  payment_status?: string;
  paymentStatus?: string;
  services?: any;
  items?: any;
  orderType?: "regular" | "custom";
  [key: string]: any;
}

// Shared helper functions - memoized for performance
export const orderHelpers = {
  getCustomerName: (order: Order) => order.customer_name || order.customerName || "N/A",
  getCustomerEmail: (order: Order) => order.customer_email || order.customerEmail || "N/A",
  getTotalAmount: (order: Order) => order.total_amount || order.totalAmount || 0,
  getCreatedAt: (order: Order) => order.created_at || order.createdAt || "",
  getPaymentStatus: (order: Order) => order.payment_status || order.paymentStatus || "unknown",
};

// Optimized status color mapping
export const statusColorMap = {
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  "in-progress": "bg-purple-500/20 text-purple-700 border-purple-500/30",
  in_progress: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  completed: "bg-green-500/20 text-green-700 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-700 border-red-500/30",
} as const;

export const getStatusColor = (status: string) => {
  return statusColorMap[status as keyof typeof statusColorMap] || "bg-gray-500/20 text-gray-700 border-gray-500/30";
};

// Currency formatter with memoization
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCurrency = (amount: number) => currencyFormatter.format(amount);

// Date formatter with memoization  
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short", 
  day: "numeric",
});

export const formatDate = (dateString: string) => {
  try {
    return dateFormatter.format(new Date(dateString));
  } catch {
    return "Invalid Date";
  }
};

// Optimized filtering and sorting functions
export const useOrderFiltersAndSorting = (allOrders: Order[]) => {
  return useMemo(() => {
    const applyFiltersAndSorting = (
      searchTerm: string,
      statusFilter: string,
      orderTypeFilter: string,
      dateRange: string,
      amountRange: string,
      sortBy: string,
      sortOrder: "asc" | "desc"
    ) => {
      if (!allOrders?.length) return [];

      // First apply filters
      let filtered = allOrders.filter(order => {
        // Search filter - optimized with early returns
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = (
            order.id.toLowerCase().includes(searchLower) ||
            orderHelpers.getCustomerName(order).toLowerCase().includes(searchLower) ||
            orderHelpers.getCustomerEmail(order).toLowerCase().includes(searchLower) ||
            order.status.toLowerCase().includes(searchLower)
          );
          if (!matchesSearch) return false;
        }

        // Status filter
        if (statusFilter !== "all" && order.status !== statusFilter) return false;

        // Order type filter  
        if (orderTypeFilter !== "all") {
          if (orderTypeFilter === "regular" && order.orderType !== "regular") return false;
          if (orderTypeFilter === "custom" && order.orderType !== "custom") return false;
        }

        // Date range filter
        if (dateRange !== "all") {
          const orderDate = new Date(orderHelpers.getCreatedAt(order));
          const now = new Date();
          
          switch (dateRange) {
            case "today":
              if (orderDate.toDateString() !== now.toDateString()) return false;
              break;
            case "week":
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (orderDate < weekAgo) return false;
              break;
            case "month":
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              if (orderDate < monthAgo) return false;
              break;
          }
        }

        // Amount range filter
        if (amountRange !== "all") {
          const amount = orderHelpers.getTotalAmount(order);
          switch (amountRange) {
            case "0-50":
              if (amount > 50) return false;
              break;
            case "50-100": 
              if (amount <= 50 || amount > 100) return false;
              break;
            case "100+":
              if (amount <= 100) return false;
              break;
          }
        }

        return true;
      });

      // Then apply sorting
      return filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case "created_at":
            aValue = new Date(orderHelpers.getCreatedAt(a));
            bValue = new Date(orderHelpers.getCreatedAt(b));
            break;
          case "total_amount":
            aValue = orderHelpers.getTotalAmount(a);
            bValue = orderHelpers.getTotalAmount(b);
            break;
          case "customer_name":
            aValue = orderHelpers.getCustomerName(a);
            bValue = orderHelpers.getCustomerName(b);
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = a[sortBy];
            bValue = b[sortBy];
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    };

    return { applyFiltersAndSorting };
  }, [allOrders]);
};

// Performance monitoring utility
export const performanceMonitor = {
  measureRender: (componentName: string) => {
    if (process.env.NODE_ENV === "development") {
      const start = performance.now();
      return () => {
        const end = performance.now();
        if (end - start > 16) { // Log slow renders (>16ms)
          console.warn(`Slow render detected: ${componentName} took ${(end - start).toFixed(2)}ms`);
        }
      };
    }
    return () => {}; // No-op in production
  },
  
  measureFunction: (functionName: string, fn: () => any) => {
    if (process.env.NODE_ENV === "development") {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      if (end - start > 5) {
        console.warn(`Slow function: ${functionName} took ${(end - start).toFixed(2)}ms`);
      }
      return result;
    }
    return fn();
  }
};

// Export analytics utility
export const exportToCSV = (orders: Order[], filename = "orders") => {
  const csvContent = [
    ["Order ID", "Customer", "Email", "Status", "Amount", "Date", "Type"].join(","),
    ...orders.map(order => [
      order.id.slice(-6),
      orderHelpers.getCustomerName(order),
      orderHelpers.getCustomerEmail(order),
      order.status,
      orderHelpers.getTotalAmount(order),
      formatDate(orderHelpers.getCreatedAt(order)),
      order.orderType || "regular"
    ].join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

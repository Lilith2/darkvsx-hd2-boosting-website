import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Package, DollarSign } from "lucide-react";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { Order, CustomOrder } from "@/lib/types";
import { OrderData } from "@/hooks/useOrders";

interface RecentOrdersCardProps {
  recentOrders: (OrderData | CustomOrder)[];
  isLoading: boolean;
  onOrderClick?: (order: OrderData | CustomOrder, type: "regular" | "custom") => void;
}

export function RecentOrdersCard({
  recentOrders,
  isLoading,
  onOrderClick,
}: RecentOrdersCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getOrderTotal = (order: OrderData | CustomOrder) => {
    if ("totalAmount" in order) {
      return order.totalAmount || 0;
    }
    return order.total_amount || 0;
  };

  const getOrderDate = (order: OrderData | CustomOrder) => {
    const date = "createdAt" in order ? order.createdAt : order.created_at;
    return new Date(date).toLocaleDateString();
  };

  const getCustomerInfo = (order: OrderData | CustomOrder) => {
    if ("customerEmail" in order) {
      return {
        name: order.customerName || "Unknown Customer",
        email: order.customerEmail || "No email",
      };
    }
    return {
      name: order.customer_name || "Unknown Customer",
      email: order.customer_email || "No email",
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
      case "processing":
        return "bg-blue-500/20 text-blue-700 border-blue-300";
      case "in-progress":
        return "bg-purple-500/20 text-purple-700 border-purple-300";
      case "completed":
        return "bg-green-500/20 text-green-700 border-green-300";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-300";
    }
  };

  const getOrderType = (order: OrderData | CustomOrder): "regular" | "custom" => {
    return "customerEmail" in order ? "regular" : "custom";
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No recent orders</p>
            <p className="text-sm">Recent order activity will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const customerInfo = getCustomerInfo(order);
              const orderType = getOrderType(order);
              
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/30 hover:bg-card/50 transition-colors cursor-pointer"
                  onClick={() => onOrderClick?.(order, orderType)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {customerInfo.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {orderType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {customerInfo.email} • {getOrderDate(order)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center text-sm font-semibold text-primary">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatCurrency(getOrderTotal(order))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

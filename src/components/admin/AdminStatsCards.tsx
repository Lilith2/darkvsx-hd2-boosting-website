import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Package,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface AdminStatsCardsProps {
  totalRevenue: number;
  pendingOrdersCount: number;
  activeServicesCount: number;
  totalCustomersCount: number;
  isLoading: boolean;
}

export function AdminStatsCards({
  totalRevenue,
  pendingOrdersCount,
  activeServicesCount,
  totalCustomersCount,
  isLoading,
}: AdminStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+12.5%",
      trendUp: true,
      description: "vs last month",
    },
    {
      title: "Pending Orders",
      value: pendingOrdersCount.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "+3",
      trendUp: true,
      description: "awaiting processing",
    },
    {
      title: "Active Services",
      value: activeServicesCount.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+2",
      trendUp: true,
      description: "services ordered",
    },
    {
      title: "Total Customers",
      value: totalCustomersCount.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "+8.2%",
      trendUp: true,
      description: "unique customers",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <LoadingSpinner />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs">
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1 ${
                      stat.trendUp
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {stat.trendUp ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.trend}
                  </Badge>
                  <span className="text-muted-foreground">{stat.description}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

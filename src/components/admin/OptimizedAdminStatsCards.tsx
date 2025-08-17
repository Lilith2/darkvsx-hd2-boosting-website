import React, { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Activity,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, performanceMonitor } from "./utils";

interface StatsData {
  totalRevenue: number;
  pendingOrdersCount: number;
  activeServicesCount: number;
  totalCustomersCount: number;
  isLoading: boolean;
  
  // Additional calculated metrics
  completedOrdersCount?: number;
  avgOrderValue?: number;
  revenueGrowth?: number;
  orderGrowth?: number;
  
  // Previous period data for trend calculation
  previousRevenue?: number;
  previousOrders?: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
  variant?: "default" | "success" | "warning" | "destructive";
}

// Memoized individual stat card component
const StatCard = memo(({ 
  title, 
  value, 
  trend, 
  icon, 
  description, 
  isLoading = false, 
  variant = "default" 
}: StatCardProps) => {
  const endMeasure = performanceMonitor.measureRender("StatCard");

  React.useEffect(() => {
    return endMeasure;
  }, [endMeasure]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-20" />
          </CardTitle>
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const cardVariantStyles = {
    default: "border-border",
    success: "border-green-500/20 bg-green-50/50 dark:bg-green-950/20",
    warning: "border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20",
    destructive: "border-red-500/20 bg-red-50/50 dark:bg-red-950/20",
  };

  const iconVariantStyles = {
    default: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    destructive: "text-red-600 dark:text-red-400",
  };

  return (
    <Card className={`transition-all hover:shadow-md ${cardVariantStyles[variant]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={iconVariantStyles[variant]}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between">
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center text-xs">
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground ml-1">
                {trend.period}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";

export interface OptimizedAdminStatsCardsProps {
  totalRevenue: number;
  pendingOrdersCount: number;
  activeServicesCount: number;
  totalCustomersCount: number;
  isLoading: boolean;
  
  // Additional props for enhanced analytics
  completedOrdersCount?: number;
  totalOrdersCount?: number;
  previousRevenue?: number;
  previousOrdersCount?: number;
  avgOrderValue?: number;
}

export const OptimizedAdminStatsCards = memo(({
  totalRevenue,
  pendingOrdersCount,
  activeServicesCount,
  totalCustomersCount,
  isLoading,
  completedOrdersCount = 0,
  totalOrdersCount = 0,
  previousRevenue = 0,
  previousOrdersCount = 0,
  avgOrderValue = 0,
}: OptimizedAdminStatsCardsProps) => {
  const endMeasure = performanceMonitor.measureRender("OptimizedAdminStatsCards");

  // Validate and sanitize input data
  const safeData = useMemo(() => {
    const safeNumber = (value: number | undefined | null): number => {
      return typeof value === 'number' && !isNaN(value) && isFinite(value) ? Math.max(0, value) : 0;
    };

    return {
      totalRevenue: safeNumber(totalRevenue),
      pendingOrdersCount: safeNumber(pendingOrdersCount),
      activeServicesCount: safeNumber(activeServicesCount),
      totalCustomersCount: safeNumber(totalCustomersCount),
      completedOrdersCount: safeNumber(completedOrdersCount),
      totalOrdersCount: safeNumber(totalOrdersCount),
      previousRevenue: safeNumber(previousRevenue),
      previousOrdersCount: safeNumber(previousOrdersCount),
      avgOrderValue: safeNumber(avgOrderValue),
    };
  }, [totalRevenue, pendingOrdersCount, activeServicesCount, totalCustomersCount, completedOrdersCount, totalOrdersCount, previousRevenue, previousOrdersCount, avgOrderValue]);

  // Calculate trends and derived metrics
  const analyticsData = useMemo(() => {
    return performanceMonitor.measureFunction("calculateAnalytics", () => {
      // Revenue trend calculation
      const revenueGrowth = safeData.previousRevenue > 0
        ? ((safeData.totalRevenue - safeData.previousRevenue) / safeData.previousRevenue) * 100
        : 0;

      // Orders trend calculation
      const orderGrowth = safeData.previousOrdersCount > 0
        ? ((safeData.totalOrdersCount - safeData.previousOrdersCount) / safeData.previousOrdersCount) * 100
        : 0;

      // Calculate average order value if not provided
      const calculatedAvgOrderValue = safeData.avgOrderValue || (
        safeData.totalOrdersCount > 0 ? safeData.totalRevenue / safeData.totalOrdersCount : 0
      );

      // Completion rate
      const completionRate = safeData.totalOrdersCount > 0
        ? (safeData.completedOrdersCount / safeData.totalOrdersCount) * 100
        : 0;

      // Determine warning states
      const hasPendingIssues = safeData.pendingOrdersCount > 10;
      const hasLowCompletionRate = completionRate < 80;
      const hasNegativeGrowth = revenueGrowth < -5;

      return {
        revenueGrowth,
        orderGrowth,
        calculatedAvgOrderValue,
        completionRate,
        hasPendingIssues,
        hasLowCompletionRate,
        hasNegativeGrowth,
      };
    });
  }, [safeData]);

  React.useEffect(() => {
    return endMeasure;
  }, [endMeasure]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCard
            key={i}
            title=""
            value=""
            icon={<Skeleton className="h-4 w-4" />}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue Card */}
      <StatCard
        title="Total Revenue"
        value={formatCurrency(safeData.totalRevenue)}
        icon={<DollarSign className="h-4 w-4" />}
        description="Total revenue this period"
        trend={analyticsData.revenueGrowth !== 0 ? {
          value: Math.round(Math.abs(analyticsData.revenueGrowth)),
          isPositive: analyticsData.revenueGrowth > 0,
          period: "vs last period"
        } : undefined}
        variant={analyticsData.hasNegativeGrowth ? "warning" : "default"}
      />

      {/* Pending Orders Card */}
      <StatCard
        title="Pending Orders"
        value={safeData.pendingOrdersCount}
        icon={<ShoppingBag className="h-4 w-4" />}
        description="Orders awaiting processing"
        variant={analyticsData.hasPendingIssues ? "warning" : "default"}
      />

      {/* Active Services Card */}
      <StatCard
        title="Active Services"
        value={safeData.activeServicesCount}
        icon={<Package className="h-4 w-4" />}
        description="Currently available services"
        variant="success"
      />

      {/* Total Customers Card */}
      <StatCard
        title="Total Customers"
        value={safeData.totalCustomersCount}
        icon={<Users className="h-4 w-4" />}
        description="Registered customers"
        trend={analyticsData.orderGrowth !== 0 ? {
          value: Math.round(Math.abs(analyticsData.orderGrowth)),
          isPositive: analyticsData.orderGrowth > 0,
          period: "order growth"
        } : undefined}
      />

      {/* Additional Analytics Row (if we have the data) */}
      {(safeData.totalOrdersCount > 0 || analyticsData.calculatedAvgOrderValue > 0) && (
        <>
          {/* Average Order Value */}
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(analyticsData.calculatedAvgOrderValue)}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Average per order"
          />

          {/* Completion Rate */}
          <StatCard
            title="Completion Rate"
            value={`${Math.round(analyticsData.completionRate)}%`}
            icon={<Activity className="h-4 w-4" />}
            description="Orders completed successfully"
            variant={analyticsData.hasLowCompletionRate ? "warning" : "success"}
          />

          {/* Total Orders */}
          <StatCard
            title="Total Orders"
            value={safeData.totalOrdersCount}
            icon={<ShoppingBag className="h-4 w-4" />}
            description="All orders processed"
            trend={analyticsData.orderGrowth !== 0 ? {
              value: Math.round(Math.abs(analyticsData.orderGrowth)),
              isPositive: analyticsData.orderGrowth > 0,
              period: "vs last period"
            } : undefined}
          />

          {/* System Status */}
          <StatCard
            title="System Status"
            value={
              analyticsData.hasPendingIssues || analyticsData.hasLowCompletionRate 
                ? "Attention" 
                : "Healthy"
            }
            icon={
              analyticsData.hasPendingIssues || analyticsData.hasLowCompletionRate 
                ? <AlertCircle className="h-4 w-4" />
                : <Activity className="h-4 w-4" />
            }
            description="Overall system health"
            variant={
              analyticsData.hasPendingIssues || analyticsData.hasLowCompletionRate 
                ? "warning" 
                : "success"
            }
          />
        </>
      )}
    </div>
  );
});

OptimizedAdminStatsCards.displayName = "OptimizedAdminStatsCards";

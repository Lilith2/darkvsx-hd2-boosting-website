import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Clock,
  Database,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface PerformanceMetrics {
  loadTime: number;
  dbConnectionTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  renderTime: number;
  errorRate: number;
  cacheHitRate: number;
  activeQueries: number;
  networkStatus: "online" | "offline";
  lastUpdate: number;
}

interface QueryPerformance {
  queryKey: string;
  averageTime: number;
  successRate: number;
  lastError?: string;
  totalCalls: number;
}

export function AdminPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    dbConnectionTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    activeQueries: 0,
    networkStatus: "online",
    lastUpdate: Date.now(),
  });

  const [queryMetrics, setQueryMetrics] = useState<QueryPerformance[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Performance monitoring functions
  const measurePageLoad = useCallback(() => {
    if (performance && performance.timing) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded =
        timing.domContentLoadedEventEnd - timing.navigationStart;

      setMetrics((prev) => ({
        ...prev,
        loadTime: loadTime / 1000, // Convert to seconds
        renderTime: domContentLoaded / 1000,
        lastUpdate: Date.now(),
      }));
    }
  }, []);

  const measureMemoryUsage = useCallback(() => {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB

      setMetrics((prev) => ({
        ...prev,
        memoryUsage: usedMemory,
        lastUpdate: Date.now(),
      }));
    }
  }, []);

  const measureDatabasePerformance = useCallback(async () => {
    const startTime = performance.now();
    try {
      const { supabase } = await import("@/integrations/supabase/client-no-realtime");

      // Simple health check query
      const { data, error } = await supabase
        .from("orders")
        .select("id")
        .limit(1);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      setMetrics((prev) => ({
        ...prev,
        dbConnectionTime: responseTime,
        apiResponseTime: responseTime,
        errorRate: error ? prev.errorRate + 1 : prev.errorRate * 0.95, // Decay error rate
        lastUpdate: Date.now(),
      }));
    } catch (error) {
      setMetrics((prev) => ({
        ...prev,
        errorRate: prev.errorRate + 1,
        lastUpdate: Date.now(),
      }));
    }
  }, []);

  const measureNetworkStatus = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      networkStatus: navigator.onLine ? "online" : "offline",
      lastUpdate: Date.now(),
    }));
  }, []);

  // Query metrics tracking
  const trackQueryPerformance = useCallback(
    (queryKey: string, time: number, success: boolean, error?: string) => {
      setQueryMetrics((prev) => {
        const existing = prev.find((q) => q.queryKey === queryKey);
        if (existing) {
          return prev.map((q) =>
            q.queryKey === queryKey
              ? {
                  ...q,
                  averageTime:
                    (q.averageTime * q.totalCalls + time) / (q.totalCalls + 1),
                  successRate: success
                    ? (q.successRate * q.totalCalls + 100) / (q.totalCalls + 1)
                    : (q.successRate * q.totalCalls) / (q.totalCalls + 1),
                  totalCalls: q.totalCalls + 1,
                  lastError: error,
                }
              : q,
          );
        } else {
          return [
            ...prev,
            {
              queryKey,
              averageTime: time,
              successRate: success ? 100 : 0,
              totalCalls: 1,
              lastError: error,
            },
          ];
        }
      });
    },
    [],
  );

  // Run performance checks
  const runPerformanceCheck = useCallback(() => {
    measurePageLoad();
    measureMemoryUsage();
    measureDatabasePerformance();
    measureNetworkStatus();
  }, [
    measurePageLoad,
    measureMemoryUsage,
    measureDatabasePerformance,
    measureNetworkStatus,
  ]);

  // Set up monitoring
  useEffect(() => {
    // Initial measurement
    runPerformanceCheck();

    // Set up auto refresh
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(runPerformanceCheck, 10000); // Every 10 seconds
    }

    // Listen for network changes
    window.addEventListener("online", measureNetworkStatus);
    window.addEventListener("offline", measureNetworkStatus);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("online", measureNetworkStatus);
      window.removeEventListener("offline", measureNetworkStatus);
    };
  }, [autoRefresh, runPerformanceCheck, measureNetworkStatus]);

  // Performance status indicators
  const getPerformanceStatus = (
    metric: keyof PerformanceMetrics,
    value: number,
  ) => {
    switch (metric) {
      case "loadTime":
        if (value < 2) return { status: "excellent", color: "bg-green-500" };
        if (value < 4) return { status: "good", color: "bg-yellow-500" };
        return { status: "poor", color: "bg-red-500" };

      case "dbConnectionTime":
        if (value < 100) return { status: "excellent", color: "bg-green-500" };
        if (value < 500) return { status: "good", color: "bg-yellow-500" };
        return { status: "poor", color: "bg-red-500" };

      case "memoryUsage":
        if (value < 50) return { status: "excellent", color: "bg-green-500" };
        if (value < 100) return { status: "good", color: "bg-yellow-500" };
        return { status: "poor", color: "bg-red-500" };

      case "errorRate":
        if (value < 1) return { status: "excellent", color: "bg-green-500" };
        if (value < 5) return { status: "good", color: "bg-yellow-500" };
        return { status: "poor", color: "bg-red-500" };

      default:
        return { status: "unknown", color: "bg-gray-500" };
    }
  };

  // Only show in development mode or when explicitly enabled
  if (process.env.NODE_ENV === "production" && !isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-6 w-6 p-0"
              >
                <RefreshCw
                  className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Network Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {metrics.networkStatus === "online" ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Network</span>
            </div>
            <Badge
              variant={
                metrics.networkStatus === "online" ? "default" : "destructive"
              }
            >
              {metrics.networkStatus}
            </Badge>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Load Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getPerformanceStatus("loadTime", metrics.loadTime).color}`}
                />
                <span className="text-xs">{metrics.loadTime.toFixed(2)}s</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm">DB Response</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getPerformanceStatus("dbConnectionTime", metrics.dbConnectionTime).color}`}
                />
                <span className="text-xs">
                  {metrics.dbConnectionTime.toFixed(0)}ms
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Memory</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getPerformanceStatus("memoryUsage", metrics.memoryUsage).color}`}
                />
                <span className="text-xs">
                  {metrics.memoryUsage.toFixed(1)}MB
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Error Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getPerformanceStatus("errorRate", metrics.errorRate).color}`}
                />
                <span className="text-xs">{metrics.errorRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Query Performance Summary */}
          {queryMetrics.length > 0 && (
            <div className="pt-2 border-t">
              <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Query Performance
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {queryMetrics.slice(0, 5).map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate flex-1">
                      {query.queryKey.split(".").pop()}
                    </span>
                    <div className="flex items-center gap-1">
                      <span>{query.averageTime.toFixed(0)}ms</span>
                      <div
                        className={`w-1 h-1 rounded-full ${
                          query.successRate > 95
                            ? "bg-green-500"
                            : query.successRate > 90
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Update */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to track query performance in React Query
export function useQueryPerformanceTracking() {
  const trackQuery = useCallback(
    (queryKey: string, startTime: number, success: boolean, error?: string) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Emit custom event for performance monitor to catch
      window.dispatchEvent(
        new CustomEvent("queryPerformance", {
          detail: { queryKey, duration, success, error },
        }),
      );
    },
    [],
  );

  return { trackQuery };
}

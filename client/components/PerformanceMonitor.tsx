import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, Database } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  dbQueries: number;
  loadTime: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    dbQueries: 0,
    loadTime: 0,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (import.meta.env.DEV) {
      setIsVisible(true);
      
      const measurePerformance = () => {
        // Measure render time
        const startTime = performance.now();
        requestAnimationFrame(() => {
          const renderTime = performance.now() - startTime;
          
          // Get memory usage (if available)
          const memory = (performance as any).memory;
          const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0;
          
          // Get page load time
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const loadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
          
          setMetrics(prev => ({
            ...prev,
            renderTime: Math.round(renderTime * 100) / 100,
            memoryUsage: Math.round(memoryUsage * 100) / 100,
            loadTime: Math.round(loadTime),
          }));
        });
      };

      // Measure performance periodically
      const interval = setInterval(measurePerformance, 5000);
      measurePerformance(); // Initial measurement

      return () => clearInterval(interval);
    }
  }, []);

  // Monitor cache performance
  useEffect(() => {
    const measureCacheHitRate = () => {
      // This would integrate with your actual cache implementation
      // For now, we'll simulate it
      const hitRate = Math.random() * 100;
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: Math.round(hitRate),
      }));
    };

    const interval = setInterval(measureCacheHitRate, 10000);
    return () => clearInterval(interval);
  }, []);

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Monitor
            <Badge variant="outline" className="text-xs">DEV</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              <span>Render Time:</span>
            </div>
            <span className={getPerformanceColor(metrics.renderTime, { good: 16, warning: 32 })}>
              {metrics.renderTime}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3" />
              <span>Memory:</span>
            </div>
            <span className={getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}>
              {metrics.memoryUsage}MB
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Load Time:</span>
            </div>
            <span className={getPerformanceColor(metrics.loadTime, { good: 2000, warning: 5000 })}>
              {metrics.loadTime}ms
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Cache Hit Rate:</span>
            <span className={getPerformanceColor(100 - metrics.cacheHitRate, { good: 10, warning: 30 })}>
              {metrics.cacheHitRate}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Web Vitals monitoring hook
export function useWebVitals() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      }).catch(() => {
        // web-vitals not available, skip
      });
    }
  }, []);
}

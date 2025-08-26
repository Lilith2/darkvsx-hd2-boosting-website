// Performance monitoring and Core Web Vitals tracking for HelldiversBoost
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
  id: string;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// Get performance rating based on thresholds
function getPerformanceRating(
  metric: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

// Generate unique ID for metrics
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Send metric to analytics endpoint
async function sendMetric(metric: PerformanceMetric): Promise<void> {
  try {
    // In production, send to your analytics service
    if (process.env.NODE_ENV === "production") {
      await fetch("/api/analytics/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metric),
      });
    } else {
      console.log("[Performance]", metric);
    }
  } catch (error) {
    console.error("[Performance] Failed to send metric:", error);
  }
}

// Track Core Web Vitals
export function trackWebVitals(): void {
  if (typeof window === "undefined") return;

  // Track LCP (Largest Contentful Paint)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const metric: PerformanceMetric = {
        name: "LCP",
        value: entry.startTime,
        rating: getPerformanceRating("LCP", entry.startTime),
        timestamp: Date.now(),
        id: generateId(),
      };
      sendMetric(metric);
    }
  }).observe({ entryTypes: ["largest-contentful-paint"] });

  // Track FID (First Input Delay)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as PerformanceEventTiming;
      const metric: PerformanceMetric = {
        name: "FID",
        value: fidEntry.processingStart - fidEntry.startTime,
        rating: getPerformanceRating(
          "FID",
          fidEntry.processingStart - fidEntry.startTime,
        ),
        timestamp: Date.now(),
        id: generateId(),
      };
      sendMetric(metric);
    }
  }).observe({ entryTypes: ["first-input"] });

  // Track CLS (Cumulative Layout Shift)
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShiftEntry = entry as any;
      if (!layoutShiftEntry.hadRecentInput) {
        clsValue += layoutShiftEntry.value;
      }
    }
  }).observe({ entryTypes: ["layout-shift"] });

  // Send CLS on page unload
  addEventListener("beforeunload", () => {
    const metric: PerformanceMetric = {
      name: "CLS",
      value: clsValue,
      rating: getPerformanceRating("CLS", clsValue),
      timestamp: Date.now(),
      id: generateId(),
    };
    sendMetric(metric);
  });

  // Track FCP (First Contentful Paint)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") {
        const metric: PerformanceMetric = {
          name: "FCP",
          value: entry.startTime,
          rating: getPerformanceRating("FCP", entry.startTime),
          timestamp: Date.now(),
          id: generateId(),
        };
        sendMetric(metric);
      }
    }
  }).observe({ entryTypes: ["paint"] });

  // Track TTFB (Time to First Byte)
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const navEntry = entry as PerformanceNavigationTiming;
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      const metric: PerformanceMetric = {
        name: "TTFB",
        value: ttfb,
        rating: getPerformanceRating("TTFB", ttfb),
        timestamp: Date.now(),
        id: generateId(),
      };
      sendMetric(metric);
    }
  }).observe({ entryTypes: ["navigation"] });
}

// Track custom performance metrics
export function trackCustomMetric(
  name: string,
  value: number,
  unit = "ms",
): void {
  const metric: PerformanceMetric = {
    name: `custom-${name}`,
    value,
    rating: "good", // Custom metrics don't have standard thresholds
    timestamp: Date.now(),
    id: generateId(),
  };

  sendMetric(metric);
}

// Track page load performance
export function trackPageLoad(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    // Track total page load time
    const pageLoadTime = performance.now();
    trackCustomMetric("page-load-time", pageLoadTime);

    // Track resource loading times
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];

    resources.forEach((resource) => {
      if (resource.duration > 100) {
        // Only track slow resources
        trackCustomMetric(
          `resource-${resource.initiatorType}`,
          resource.duration,
        );
      }
    });

    // Track memory usage (if available)
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      trackCustomMetric(
        "memory-used",
        memory.usedJSHeapSize / 1024 / 1024,
        "MB",
      );
    }
  });
}

// Track user interactions
export function trackInteraction(action: string, category = "user"): void {
  const startTime = performance.now();

  // Measure interaction time
  requestIdleCallback(() => {
    const duration = performance.now() - startTime;
    trackCustomMetric(`${category}-${action}`, duration);
  });
}

// Performance budget monitoring
export function checkPerformanceBudget(): void {
  if (typeof window === "undefined") return;

  const budget = {
    "bundle-js": 500 * 1024, // 500KB JS budget
    "bundle-css": 100 * 1024, // 100KB CSS budget
    images: 2 * 1024 * 1024, // 2MB images budget
  };

  const resources = performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
  const usage = {
    "bundle-js": 0,
    "bundle-css": 0,
    images: 0,
  };

  resources.forEach((resource) => {
    if (!resource || !resource.name || typeof resource.name !== "string")
      return;

    if (resource.name.includes(".js")) {
      usage["bundle-js"] += resource.transferSize || 0;
    } else if (resource.name.includes(".css")) {
      usage["bundle-css"] += resource.transferSize || 0;
    } else if (/\.(jpg|jpeg|png|gif|webp|avif)$/i.test(resource.name)) {
      usage["images"] += resource.transferSize || 0;
    }
  });

  // Check budget overruns
  Object.entries(budget).forEach(([type, limit]) => {
    const used = usage[type as keyof typeof usage];
    const percentage = (used / limit) * 100;

    if (percentage > 90) {
      console.warn(
        `[Performance Budget] ${type} usage at ${percentage.toFixed(1)}% (${used}/${limit} bytes)`,
      );
      trackCustomMetric(`budget-${type}`, percentage, "%");
    }
  });
}

// Initialize all performance tracking
export function initializePerformanceTracking(): void {
  if (typeof window === "undefined") return;

  // Track Core Web Vitals
  trackWebVitals();

  // Track page load performance
  trackPageLoad();

  // Check performance budget
  checkPerformanceBudget();

  console.log("[Performance] Tracking initialized");
}

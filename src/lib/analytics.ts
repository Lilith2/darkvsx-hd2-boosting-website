// Analytics and performance tracking utilities

// Declare global gtag function
declare global {
  function gtag(...args: any[]): void;
}

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

// Track page load performance
export function trackPerformanceMetrics() {
  if (typeof window === "undefined") return;

  // Wait for page to load
  window.addEventListener("load", () => {
    // Use requestIdleCallback to avoid blocking main thread
    if ("requestIdleCallback" in window) {
      requestIdleCallback(collectMetrics);
    } else {
      setTimeout(collectMetrics, 0);
    }
  });
}

function collectMetrics() {
  try {
    // Check if performance API is available
    if (!performance || !performance.getEntriesByType) {
      console.warn("Performance API not available");
      return;
    }

    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    if (!navigation) {
      console.warn("Navigation timing not available");
      return;
    }

    const paint = performance.getEntriesByType("paint");

    const metrics: Partial<PerformanceMetrics> = {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded:
        navigation.domContentLoadedEventEnd - navigation.fetchStart,
    };

    // First Contentful Paint
    const fcp = paint.find((entry) => entry.name === "first-contentful-paint");
    if (fcp) {
      metrics.firstContentfulPaint = fcp.startTime;
    }

    // Largest Contentful Paint
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.largestContentfulPaint = lastEntry.startTime;
          sendMetrics(metrics);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        console.warn("LCP observer not supported");
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        console.warn("CLS observer not supported");
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.firstInputDelay =
              (entry as any).processingStart - entry.startTime;
            sendMetrics(metrics);
          }
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        console.warn("FID observer not supported");
      }
    }

    // Send basic metrics immediately
    sendMetrics(metrics);
  } catch (error) {
    console.warn("Performance metrics collection failed:", error);
  }
}

function sendMetrics(metrics: Partial<PerformanceMetrics>) {
  // Only log to console in development, avoid any network calls
  if (process.env.NODE_ENV === "development") {
    console.log("Performance Metrics:", metrics);
    return;
  }

  // Send to analytics service only in production (Google Analytics, etc.)
  try {
    if (typeof gtag !== "undefined") {
      gtag("event", "page_performance", {
        load_time: Math.round(metrics.loadTime || 0),
        dom_content_loaded: Math.round(metrics.domContentLoaded || 0),
        first_contentful_paint: Math.round(metrics.firstContentfulPaint || 0),
        largest_contentful_paint: Math.round(
          metrics.largestContentfulPaint || 0,
        ),
        cumulative_layout_shift: metrics.cumulativeLayoutShift || 0,
        first_input_delay: Math.round(metrics.firstInputDelay || 0),
      });
    }
  } catch (error) {
    console.warn("Failed to send analytics metrics:", error);
  }
}

// Track user interactions
export function trackEvent(
  eventName: string,
  parameters?: Record<string, any>,
) {
  try {
    if (typeof gtag !== "undefined") {
      gtag("event", eventName, parameters);
    }

    // Analytics events are tracked silently in production
  } catch (error) {
    console.warn("Failed to track event:", error);
  }
}

// Track page views
export function trackPageView(path: string, title?: string) {
  try {
    if (typeof gtag !== "undefined") {
      gtag("config", "GA_MEASUREMENT_ID", {
        page_path: path,
        page_title: title || document?.title || "",
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Page View:", path, title);
    }
  } catch (error) {
    console.warn("Failed to track page view:", error);
  }
}

// Track errors
export function trackError(error: Error, context?: string) {
  try {
    if (typeof gtag !== "undefined") {
      gtag("event", "exception", {
        description: error.message,
        fatal: false,
        context: context,
      });
    }

    console.error("Tracked Error:", error, context);
  } catch (e) {
    console.warn("Failed to track error:", e);
  }
}

// Core Web Vitals scoring
export function getWebVitalsScore(metrics: Partial<PerformanceMetrics>) {
  const scores = {
    lcp: getScoreForMetric(metrics.largestContentfulPaint, [2500, 4000]),
    fid: getScoreForMetric(metrics.firstInputDelay, [100, 300]),
    cls: getScoreForMetric(metrics.cumulativeLayoutShift, [0.1, 0.25]),
  };

  return {
    ...scores,
    overall: (scores.lcp + scores.fid + scores.cls) / 3,
  };
}

function getScoreForMetric(
  value: number | undefined,
  thresholds: [number, number],
): number {
  if (value === undefined) return 0;
  if (value <= thresholds[0]) return 100;
  if (value <= thresholds[1]) return 75;
  return 50;
}

// Initialize analytics with better error handling
export function initializeAnalytics() {
  // Guard against server-side execution
  if (typeof window === "undefined") return;

  try {
    // Track performance metrics only if available
    if (performance && performance.getEntriesByType) {
      trackPerformanceMetrics();
    }

    // Track page visibility changes only if document is available
    if (document && document.addEventListener) {
      document.addEventListener("visibilitychange", () => {
        try {
          trackEvent("page_visibility_change", {
            visibility_state: document.visibilityState,
          });
        } catch (error) {
          console.warn("Failed to track visibility change:", error);
        }
      });
    }

    // Track errors with better error handling
    if (window.addEventListener) {
      window.addEventListener("error", (event) => {
        try {
          if (event.error) {
            trackError(event.error, "window_error");
          }
        } catch (error) {
          console.warn("Failed to track window error:", error);
        }
      });

      window.addEventListener("unhandledrejection", (event) => {
        try {
          // Filter out HMR-related errors and fetch errors from external services
          const reason = event.reason;
          if (reason && typeof reason === "object") {
            const message = reason.message || "";

            // Skip HMR and development-related errors
            if (
              message.includes("Loading CSS chunk") ||
              message.includes("Loading chunk") ||
              message.includes("hmr") ||
              message.includes("fullstory") ||
              (message.includes("Failed to fetch") &&
                process.env.NODE_ENV === "development")
            ) {
              return;
            }
          }

          trackError(new Error(event.reason), "unhandled_promise_rejection");
        } catch (error) {
          console.warn("Failed to track promise rejection:", error);
        }
      });
    }
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

// Declare global gtag function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

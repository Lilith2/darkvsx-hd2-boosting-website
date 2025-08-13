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
  if (typeof window === 'undefined') return;

  // Wait for page to load
  window.addEventListener('load', () => {
    // Use requestIdleCallback to avoid blocking main thread
    if ('requestIdleCallback' in window) {
      requestIdleCallback(collectMetrics);
    } else {
      setTimeout(collectMetrics, 0);
    }
  });
}

function collectMetrics() {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const metrics: Partial<PerformanceMetrics> = {
      loadTime: navigation.loadEventEnd - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
    };

    // First Contentful Paint
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) {
      metrics.firstContentfulPaint = fcp.startTime;
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.largestContentfulPaint = lastEntry.startTime;
          sendMetrics(metrics);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
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
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
            sendMetrics(metrics);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }

    // Send basic metrics immediately
    sendMetrics(metrics);
  } catch (error) {
    console.warn('Performance metrics collection failed:', error);
  }
}

function sendMetrics(metrics: Partial<PerformanceMetrics>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance Metrics:', metrics);
  }

  // Send to analytics service (Google Analytics, etc.)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_performance', {
      load_time: Math.round(metrics.loadTime || 0),
      dom_content_loaded: Math.round(metrics.domContentLoaded || 0),
      first_contentful_paint: Math.round(metrics.firstContentfulPaint || 0),
      largest_contentful_paint: Math.round(metrics.largestContentfulPaint || 0),
      cumulative_layout_shift: metrics.cumulativeLayoutShift || 0,
      first_input_delay: Math.round(metrics.firstInputDelay || 0),
    });
  }
}

// Track user interactions
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, parameters);
  }

  // Also log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, parameters);
  }
}

// Track page views
export function trackPageView(path: string, title?: string) {
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Page View:', path, title);
  }
}

// Track errors
export function trackError(error: Error, context?: string) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      context: context,
    });
  }

  console.error('Tracked Error:', error, context);
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

function getScoreForMetric(value: number | undefined, thresholds: [number, number]): number {
  if (value === undefined) return 0;
  if (value <= thresholds[0]) return 100;
  if (value <= thresholds[1]) return 75;
  return 50;
}

// Initialize analytics
export function initializeAnalytics() {
  if (typeof window === 'undefined') return;

  // Track performance metrics
  trackPerformanceMetrics();

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    trackEvent('page_visibility_change', {
      visibility_state: document.visibilityState,
    });
  });

  // Track errors
  window.addEventListener('error', (event) => {
    trackError(event.error, 'window_error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), 'unhandled_promise_rejection');
  });
}

// Declare global gtag function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

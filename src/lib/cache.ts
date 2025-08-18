// Simple cache utility for optimizing API calls and browser storage
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Maximum number of cache entries

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Default 5 minutes
    // Clean up old entries if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Browser storage helpers
  setLocalStorage<T>(
    key: string,
    data: T,
    ttl: number = 24 * 60 * 60 * 1000,
  ): void {
    // Default 24 hours
    if (typeof window === "undefined") return;

    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn("Failed to set localStorage:", error);
    }
  }

  getLocalStorage<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);

      // Check if item has expired
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn("Failed to get localStorage:", error);
      return null;
    }
  }

  removeLocalStorage(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  }

  // Prefetch utility for critical resources
  prefetchResource(url: string): void {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  }

  // Preload critical resources
  preloadResource(url: string, as: string = "fetch"): void {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.href = url;
    link.as = as;
    if (as === "fetch") {
      link.crossOrigin = "anonymous";
    }
    document.head.appendChild(link);
  }
}

export const cache = new CacheManager();

// Performance monitoring utility
export const performance = {
  mark: (name: string): void => {
    if (typeof window !== "undefined" && window.performance) {
      window.performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string): void => {
    if (typeof window !== "undefined" && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn("Performance measurement failed:", error);
      }
    }
  },

  getEntries: (type?: string): PerformanceEntry[] => {
    if (typeof window !== "undefined" && window.performance) {
      return type
        ? window.performance.getEntriesByType(type)
        : window.performance.getEntries();
    }
    return [];
  },
};

// Image lazy loading utility
export const imageOptimization = {
  loadImage: (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  preloadImages: (urls: string[]): Promise<HTMLImageElement[]> => {
    return Promise.all(urls.map((url) => imageOptimization.loadImage(url)));
  },
};

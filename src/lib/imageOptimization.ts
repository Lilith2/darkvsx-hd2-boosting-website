// Image optimization utilities for better performance

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "png" | "jpg";
  lazy?: boolean;
}

export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {},
): string {
  // If it's a local image, return as-is (Vite will handle optimization)
  if (src.startsWith("/") || src.startsWith("./")) {
    return src;
  }

  // For external images, you could integrate with services like Cloudinary, ImageKit, etc.
  // For now, return the original URL
  return src;
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

// Intersection Observer for lazy loading
export class LazyImageObserver {
  private observer: IntersectionObserver;
  private images: Set<HTMLImageElement> = new Set();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      },
    );
  }

  observe(img: HTMLImageElement) {
    this.images.add(img);
    this.observer.observe(img);
  }

  unobserve(img: HTMLImageElement) {
    this.images.delete(img);
    this.observer.unobserve(img);
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.remove("lazy");
      img.classList.add("loaded");
      this.observer.unobserve(img);
    }
  }

  disconnect() {
    this.observer.disconnect();
    this.images.clear();
  }
}

// Global lazy image observer instance
export const lazyImageObserver = new LazyImageObserver();

// Performance monitoring for images
export function trackImagePerformance(src: string, startTime: number) {
  const duration = performance.now() - startTime;

  if (process.env.NODE_ENV === 'development') {
    console.log(`Image loaded: ${src} in ${duration.toFixed(2)}ms`);
  }

  // Could send to analytics service
  return duration;
}

// Utility to get image dimensions without loading
export function getImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

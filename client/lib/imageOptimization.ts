// Image optimization utilities for better performance

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'png' | 'jpg';
  lazy?: boolean;
}

export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  // If it's a local image, return as-is (Vite will handle optimization)
  if (src.startsWith('/') || src.startsWith('./')) {
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
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
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
      img.classList.remove('lazy');
      img.classList.add('loaded');
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

// React hook for lazy images
import { useEffect, useRef } from 'react';

export function useLazyImage() {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      lazyImageObserver.observe(img);
      return () => lazyImageObserver.unobserve(img);
    }
  }, []);

  return imgRef;
}

// Optimized Image component
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lazy?: boolean;
  fallback?: string;
  optimization?: ImageOptimizationOptions;
}

export function OptimizedImage({
  src,
  alt,
  lazy = true,
  fallback = '/placeholder.svg',
  optimization = {},
  className = '',
  ...props
}: OptimizedImageProps) {
  const imgRef = useLazyImage();
  const optimizedSrc = getOptimizedImageUrl(src, optimization);

  if (lazy) {
    return (
      <img
        ref={imgRef}
        data-src={optimizedSrc}
        src={fallback}
        alt={alt}
        className={`lazy transition-opacity duration-300 ${className}`}
        loading="lazy"
        {...props}
      />
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={className}
      {...props}
    />
  );
}
// Mobile performance utilities
export const mobile = {
  // Detect mobile device
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Get device pixel ratio for high-DPI displays
  getPixelRatio: (): number => {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
  },

  // Check if device supports touch
  isTouchDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Get viewport dimensions
  getViewport: () => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },

  // Check if device is in landscape mode
  isLandscape: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  },

  // Optimize images for mobile
  getOptimizedImageUrl: (url: string, width?: number, quality: number = 80): string => {
    if (!url) return url;
    
    const viewport = mobile.getViewport();
    const pixelRatio = mobile.getPixelRatio();
    const targetWidth = width || Math.min(viewport.width * pixelRatio, 1920);
    
    // For Next.js Image optimization
    const params = new URLSearchParams({
      w: targetWidth.toString(),
      q: quality.toString(),
    });
    
    return `/_next/image?url=${encodeURIComponent(url)}&${params.toString()}`;
  },

  // Debounce function for scroll and resize events
  debounce: <T extends (...args: any[]) => void>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    }) as T;
  },

  // Throttle function for high-frequency events
  throttle: <T extends (...args: any[]) => void>(func: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Lazy load content with Intersection Observer
  createLazyLoader: (callback: (entries: IntersectionObserverEntry[]) => void) => {
    if (typeof window === 'undefined') return null;
    
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    };
    
    return new IntersectionObserver(callback, options);
  },

  // Preload critical resources
  preloadCriticalResources: (resources: string[]) => {
    if (typeof window === 'undefined') return;
    
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  },

  // Optimize touch events for better mobile interaction
  addTouchOptimization: () => {
    if (typeof window === 'undefined' || !mobile.isTouchDevice()) return;
    
    // Add touch-action CSS for better scrolling
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      .no-touch-action {
        touch-action: none;
      }
      .pan-x {
        touch-action: pan-x;
      }
      .pan-y {
        touch-action: pan-y;
      }
    `;
    document.head.appendChild(style);

    // Prevent zoom on double tap for better UX
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  },

  // Safe area insets for notched devices
  getSafeAreaInsets: () => {
    if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
    
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    };
  },
};

// Hook for mobile-specific optimizations
export const useMobileOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  // Add mobile optimizations on mount
  mobile.addTouchOptimization();
  
  // Preload critical resources
  mobile.preloadCriticalResources([
    '/favicon.ico',
    '/placeholder.svg',
  ]);
};

import { useRef, useCallback } from "react";

interface RequestCache {
  [key: string]: Promise<any>;
}

export function useRequestDeduplication() {
  const pendingRequests = useRef<RequestCache>({});

  const dedupe = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>,
    cacheTime: number = 5000 // Cache for 5 seconds by default
  ): Promise<T> => {
    // If request is already pending, return the existing promise
    if (pendingRequests.current[key]) {
      return pendingRequests.current[key];
    }

    // Create new request
    const promise = requestFn();
    pendingRequests.current[key] = promise;

    try {
      const result = await promise;
      
      // Clear cache after specified time
      setTimeout(() => {
        delete pendingRequests.current[key];
      }, cacheTime);
      
      return result;
    } catch (error) {
      // Remove failed request immediately so it can be retried
      delete pendingRequests.current[key];
      throw error;
    }
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      delete pendingRequests.current[key];
    } else {
      pendingRequests.current = {};
    }
  }, []);

  const isRequestPending = useCallback((key: string) => {
    return Boolean(pendingRequests.current[key]);
  }, []);

  return {
    dedupe,
    clearCache,
    isRequestPending,
  };
}

// Higher-order function to create request keys
export function createRequestKey(prefix: string, ...params: (string | number)[]): string {
  return `${prefix}:${params.join(":")}`;
}
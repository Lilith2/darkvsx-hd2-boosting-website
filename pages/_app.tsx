import type { AppProps } from "next/app";
import { useEffect } from "react";
import Head from "next/head";
import "../src/global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CoreDataProvider } from "@/components/providers/CoreDataProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityWrapper } from "@/components/AccessibilityWrapper";
import { SEOHead } from "@/components/SEOHead";
import { SecurityProvider } from "@/components/SecurityProvider";
import { Layout } from "@/components/Layout";
import { initializeAnalytics } from "@/lib/analytics";
import { initializeSecurity } from "@/lib/security";
import { registerServiceWorker } from "@/lib/sw-registration";

// Create QueryClient with optimized settings for MPA
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Reconnect for MPA reliability
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 403) return false;
        return failureCount < 2;
      },
      notifyOnChangeProps: ["data", "error"],
      // Add network mode for offline resilience
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 1,
      networkMode: "online",
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize analytics and performance tracking
    initializeAnalytics();

    // Initialize security measures
    initializeSecurity();

    // Register Service Worker for offline support and caching
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <ErrorBoundary>
        <SecurityProvider>
          <AccessibilityWrapper>
            <SEOHead />
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <CoreDataProvider>
                  <Layout>
                    <Component {...pageProps} />
                    <Toaster />
                    <Sonner />
                  </Layout>
                </CoreDataProvider>
              </TooltipProvider>
            </QueryClientProvider>
          </AccessibilityWrapper>
        </SecurityProvider>
      </ErrorBoundary>
    </>
  );
}

import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../src/global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ServicesProvider } from "@/hooks/useServices";
import { BundlesProvider } from "@/hooks/useBundles";
import { CartProvider } from "@/hooks/useCart";
import { OrdersProvider } from "@/hooks/useOrders";
import { ReferralsProvider } from "@/hooks/useReferrals";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityWrapper } from "@/components/AccessibilityWrapper";
import { SEOHead } from "@/components/SEOHead";
import { SecurityProvider } from "@/components/SecurityProvider";
import { Layout } from "@/components/Layout";
import { AppContent } from "@/components/AppContent";
import { initializeAnalytics } from "@/lib/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize analytics and performance tracking
    initializeAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <SecurityProvider>
        <AccessibilityWrapper>
          <SEOHead />
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AuthProvider>
                <ServicesProvider>
                  <BundlesProvider>
                    <CartProvider>
                      <OrdersProvider>
                        <ReferralsProvider>
                          <AppContent>
                            <Layout>
                              <Component {...pageProps} />
                              <Toaster />
                              <Sonner />
                            </Layout>
                          </AppContent>
                        </ReferralsProvider>
                      </OrdersProvider>
                    </CartProvider>
                  </BundlesProvider>
                </ServicesProvider>
              </AuthProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </AccessibilityWrapper>
      </SecurityProvider>
    </ErrorBoundary>
  );
}

import "./global.css";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { UnifiedProductsProvider } from "@/hooks/useUnifiedProducts";
import { UnifiedOrdersProvider } from "@/hooks/useUnifiedOrders";
import { UserActivitiesProvider } from "@/hooks/useUserActivities";
import { CommunicationsProvider } from "@/hooks/useCommunications";
import { CartProvider } from "@/hooks/useCart";
import { ReferralsProvider } from "@/hooks/useReferrals";
import { AppContent } from "@/components/AppContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityWrapper } from "@/components/AccessibilityWrapper";
import { SEOHead } from "@/components/SEOHead";
import { SecurityProvider } from "@/components/SecurityProvider";
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

// Separate component to ensure all providers are properly initialized
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <AccessibilityWrapper>
          <SEOHead />
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AuthProvider>
                <UnifiedProductsProvider>
                  <UnifiedOrdersProvider>
                    <UserActivitiesProvider>
                      <CommunicationsProvider>
                        <CartProvider>
                          <ReferralsProvider>{children}</ReferralsProvider>
                        </CartProvider>
                      </CommunicationsProvider>
                    </UserActivitiesProvider>
                  </UnifiedOrdersProvider>
                </UnifiedProductsProvider>
              </AuthProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </AccessibilityWrapper>
      </SecurityProvider>
    </ErrorBoundary>
  );
}

function App() {
  useEffect(() => {
    // Initialize analytics and performance tracking
    initializeAnalytics();
  }, []);

  return (
    <AppProviders>
      <Toaster />
      <Sonner />
      <AppContent />
    </AppProviders>
  );
}

export default App;

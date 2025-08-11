import "./global.css";

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
import { AppContent } from "@/components/AppContent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityWrapper } from "@/components/AccessibilityWrapper";

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

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityWrapper>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <ServicesProvider>
                <BundlesProvider>
                  <CartProvider>
                    <OrdersProvider>
                      <ReferralsProvider>
                        <Toaster />
                        <Sonner />
                        <AppContent />
                      </ReferralsProvider>
                    </OrdersProvider>
                  </CartProvider>
                </BundlesProvider>
              </ServicesProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </AccessibilityWrapper>
    </ErrorBoundary>
  );
}

export default App;

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
import { AppContent } from "@/components/AppContent";
import { DatabaseStatus } from "@/components/DatabaseStatus";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ServicesProvider>
            <BundlesProvider>
              <CartProvider>
                <OrdersProvider>
                  <Toaster />
                  <Sonner />
                  <DatabaseStatus />
                  <AppContent />
                </OrdersProvider>
              </CartProvider>
            </BundlesProvider>
          </ServicesProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

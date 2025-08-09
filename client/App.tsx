import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ServicesProvider } from "@/hooks/useServices";
import { CartProvider } from "@/hooks/useCart";
import { OrdersProvider } from "@/hooks/useOrders";
import { AppContent } from "@/components/AppContent";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ServicesProvider>
            <CartProvider>
              <OrdersProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </OrdersProvider>
            </CartProvider>
          </ServicesProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

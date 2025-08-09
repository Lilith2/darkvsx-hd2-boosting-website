import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "../pages/Index";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Cart from "../pages/Cart";
import Account from "../pages/Account";
import AdminDashboard from "../pages/AdminDashboard";
import EnhancedAdminDashboard from "../pages/EnhancedAdminDashboard";
import FAQ from "../pages/FAQ";
import Bundles from "../pages/Bundles";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Checkout from "../pages/Checkout";
import Terms from "../pages/Terms";
import Privacy from "../pages/Privacy";
import OrderTracking from "../pages/OrderTracking";
import NotFound from "../pages/NotFound";

export function AppContent() {
  const { loading } = useAuth();

  // Show loading only for first 3 seconds, then force render
  const [forceRender, setForceRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceRender(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Loading HelldiversBoost...</p>
          <p className="text-sm text-muted-foreground mt-2">Connecting to database...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/bundles" element={<Bundles />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/order/:orderId"
            element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <EnhancedAdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

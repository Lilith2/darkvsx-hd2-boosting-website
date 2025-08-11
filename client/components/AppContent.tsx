import { useState, useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { LoadingFallback, OptimizedSpinner } from "@/components/LoadingFallback";

// Keep critical pages non-lazy for immediate loading
import Index from "../pages/Index";
import NotFound from "../pages/NotFound";

// Lazy load all other pages for better performance
import {
  LazyAccount,
  LazyAdminDashboard,
  LazyBundles,
  LazyCart,
  LazyCheckout,
  LazyContact,
  LazyEmailConfirmation,
  LazyFAQ,
  LazyForgotPassword,
  LazyLogin,
  LazyOrderTracking,
  LazyPrivacy,
  LazyRegister,
  LazyTerms,
} from "@/components/LazyComponents";

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
          <OptimizedSpinner size="lg" />
          <p className="text-lg font-medium text-foreground mt-4">
            Loading HelldiversBoost...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Connecting to database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<LoadingFallback variant="page" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LazyLogin />} />
            <Route path="/register" element={<LazyRegister />} />
            <Route
              path="/email-confirmation"
              element={<LazyEmailConfirmation />}
            />
            <Route path="/forgot-password" element={<LazyForgotPassword />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback variant="card" />}>
                    <LazyCart />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback variant="page" />}>
                    <LazyAccount />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="/faq" element={<LazyFAQ />} />
            <Route path="/bundles" element={<LazyBundles />} />
            <Route path="/contact" element={<LazyContact />} />
            {/* Redirect old routes to home */}
            <Route path="/about" element={<Navigate to="/" replace />} />
            <Route path="/Index" element={<Navigate to="/" replace />} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<LoadingFallback variant="card" />}>
                  <LazyCheckout />
                </Suspense>
              }
            />
            <Route path="/terms" element={<LazyTerms />} />
            <Route path="/privacy" element={<LazyPrivacy />} />
            <Route
              path="/order/:orderId"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback variant="card" />}>
                    <LazyOrderTracking />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Suspense fallback={<LoadingFallback variant="page" />}>
                    <LazyAdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

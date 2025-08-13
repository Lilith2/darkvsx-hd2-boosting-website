import { useState, useEffect } from "react";
import { useSafeAuth } from "@/hooks/useSafeAuth";
import {
  LoadingFallback,
  OptimizedSpinner,
} from "@/components/LoadingFallback";

export function AppContent({ children }: { children: React.ReactNode }) {
  const { loading } = useSafeAuth();

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

  return <>{children}</>;
}

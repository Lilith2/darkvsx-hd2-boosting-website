import { useContext } from "react";
import { AppContent } from "./AppContent";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Create a component that checks if auth context is available
function AuthContextChecker({ children }: { children: React.ReactNode }) {
  try {
    // This will throw if not inside AuthProvider
    useAuth();
    return <>{children}</>;
  } catch (error) {
    console.error("Auth context not available, wrapping with AuthProvider");
    // If auth context is not available, wrap with AuthProvider
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }
}

export function SafeAppContent() {
  return (
    <AuthContextChecker>
      <AppContent />
    </AuthContextChecker>
  );
}

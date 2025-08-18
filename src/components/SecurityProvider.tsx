import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { initializeSecurity, security } from "@/lib/security";

interface SecurityContextType {
  checkRateLimit: (
    key: string,
    maxAttempts: number,
    windowMs: number,
  ) => boolean;
  logSecurityEvent: (
    type: string,
    action: string,
    details?: Record<string, any>,
  ) => void;
  isSecureEnvironment: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined,
);

export function SecurityProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize security measures when the app starts
    initializeSecurity();
  }, []);

  const checkRateLimit = (
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): boolean => {
    const rateLimiter = security.createRateLimit(maxAttempts, windowMs);
    return rateLimiter(key);
  };

  const logSecurityEvent = (
    type: string,
    action: string,
    details?: Record<string, any>,
  ) => {
    // Simple console logging for security events in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Security Event] ${type}: ${action}`, details);
    }
  };

  const isSecureEnvironment =
    typeof window !== "undefined" &&
    (window.location.protocol === "https:" ||
      window.location.hostname === "localhost");

  return (
    <SecurityContext.Provider
      value={{
        checkRateLimit,
        logSecurityEvent,
        isSecureEnvironment,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}

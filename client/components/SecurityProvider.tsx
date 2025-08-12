import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { initializeSecurity, auditLogger, rateLimiter } from "@/lib/security";

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
    return rateLimiter.check(key, maxAttempts, windowMs);
  };

  const logSecurityEvent = (
    type: string,
    action: string,
    details?: Record<string, any>,
  ) => {
    auditLogger.log({
      type: type as any,
      action,
      details,
    });
  };

  const isSecureEnvironment =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost";

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

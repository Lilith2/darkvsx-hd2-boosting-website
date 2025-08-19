import { useState, useEffect } from "react";
import { formatDisplayDate } from "@/lib/date-utils";

interface ClientOnlyDateProps {
  date: string | Date;
  fallback?: string;
  className?: string;
}

/**
 * Component that only renders dates on the client side to prevent hydration mismatches
 * Shows a fallback during SSR and hydration
 */
export function ClientOnlyDate({
  date,
  fallback = "Loading...",
  className,
}: ClientOnlyDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{formatDisplayDate(date)}</span>;
}

/**
 * Hook for client-only date formatting
 */
export function useClientDate(date: string | Date): string | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return formatDisplayDate(date);
}

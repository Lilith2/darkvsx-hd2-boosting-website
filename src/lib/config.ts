// Site configuration utilities
export const getSiteUrl = (): string => {
  // In production, use the actual domain
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback for SSR or initial load - use env var or error in production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Dev fallback only
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Production should always have NEXT_PUBLIC_SITE_URL set
  console.warn("NEXT_PUBLIC_SITE_URL not set in production!");
  return "https://hellboost.vercel.app"; // Last resort fallback
};

export const getSiteDomain = (): string => {
  const url = getSiteUrl();
  return url.replace(/^https?:\/\//, "");
};

// Referral configuration
export const REFERRAL_CONFIG = {
  customerDiscount: 0.15, // 15% off for customer using code
  referrerCommission: 0.1, // 10% commission for referrer
  codeFormat: /^HD2BOOST-[A-Z0-9]{6}$/,
} as const;

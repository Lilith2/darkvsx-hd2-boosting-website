// Site configuration utilities
export const getSiteUrl = (): string => {
  // In production, use the actual domain
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback for SSR or initial load
  return process.env.NEXT_PUBLIC_SITE_URL || "https://helldivers-boost.com";
};

export const getSiteDomain = (): string => {
  const url = getSiteUrl();
  return url.replace(/^https?:\/\//, "");
};

// Referral configuration
export const REFERRAL_CONFIG = {
  customerDiscount: 0.15, // 15% off for customer using code
  referrerCommission: 0.10, // 10% commission for referrer
  codeFormat: /^HD2BOOST-[A-Z0-9]{6}$/,
} as const;

// API and Configuration Constants
export const API_CONSTANTS = {
  SUPABASE_RETRIES: 3,
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  LOADING_TIMEOUT: 3000, // 3 seconds
} as const;

// UI Constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 4000,
  DEBOUNCE_DELAY: 300,
} as const;

// Referral System Constants
export const REFERRAL_CONSTANTS = {
  CUSTOMER_DISCOUNT: 0.15, // 15% - standardized with config.ts
  REFERRER_COMMISSION: 0.05, // 5%
  CODE_FORMAT: /^HD2BOOST-[A-Z0-9]{6}$/,
  CODE_PREFIX: "HD2BOOST-",
} as const;

// Payment and Tax Constants
export const PAYMENT_CONSTANTS = {
  TAX_RATE: 0.08, // 8% sales tax (configurable by region/business requirements)
  TAX_LABEL: "Sales Tax (8%)", // Display label for tax
  // Note: This is general sales tax, not payment gateway processing fees
  // Payment processing fees are separate and handled by the payment provider
} as const;

// Order Status Types
export const ORDER_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

// Payment Status Types
export const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

// Service Categories
export const SERVICE_CATEGORIES = {
  LEVEL_BOOST: "Level Boost",
  WEAPONS: "Weapons",
  CURRENCY: "Currency",
  MISSIONS: "Missions",
  ACHIEVEMENTS: "Achievements",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  AUTH_ERROR: "Authentication failed. Please try logging in again.",
  PERMISSION_ERROR: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  GENERIC_ERROR: "An unexpected error occurred. Please try again.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_PLACED: "Order placed successfully!",
  PROFILE_UPDATED: "Profile updated successfully!",
  PASSWORD_CHANGED: "Password changed successfully!",
  REFERRAL_COPIED: "Referral code copied to clipboard!",
} as const;

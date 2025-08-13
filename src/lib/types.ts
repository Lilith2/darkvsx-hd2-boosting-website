import { OrderStatus, PaymentStatus } from './constants';

// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  username?: string;
  is_admin?: boolean;
  discord_username?: string;
}

// Service types
export interface Service extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  features?: string[];
  estimated_completion?: string;
}

// Bundle types
export interface Bundle extends BaseEntity {
  name: string;
  description: string;
  services: Service[];
  discount_percentage: number;
  is_active: boolean;
  image_url?: string;
}

// Cart types
export interface CartItem {
  service: Service;
  quantity: number;
}

// Order types
export interface OrderService {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order extends BaseEntity {
  user_id: string;
  services: OrderService[];
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_id?: string;
  progress?: number;
  notes?: string;
  ip_address?: string;
  referred_by_user_id?: string;
  referral_code?: string;
  referral_discount?: number;
  referral_credits_used?: number;
}

// Referral types
export interface Referral extends BaseEntity {
  referrer_user_id: string;
  referred_user_id: string | null;
  referral_code: string;
  order_id: string;
  commission_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface ReferralCredits {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface ReferralStats {
  total_referred: number;
  total_earned: number;
  pending_earnings: number;
  referrals: Referral[];
  credits: ReferralCredits;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
}

export interface ProfileForm {
  username: string;
  email: string;
  discord_username?: string;
}

export interface PasswordChangeForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

// Event types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

// Utility types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

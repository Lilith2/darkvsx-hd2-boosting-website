import { lazy } from 'react';

// Lazy load page components for better performance
export const LazyAccount = lazy(() => import('@/pages/Account'));
export const LazyAdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const LazyBundles = lazy(() => import('@/pages/Bundles'));
export const LazyCart = lazy(() => import('@/pages/Cart'));
export const LazyCheckout = lazy(() => import('@/pages/Checkout'));
export const LazyContact = lazy(() => import('@/pages/Contact'));
export const LazyEmailConfirmation = lazy(() => import('@/pages/EmailConfirmation'));
export const LazyFAQ = lazy(() => import('@/pages/FAQ'));
export const LazyForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
export const LazyLogin = lazy(() => import('@/pages/Login'));
export const LazyOrderTracking = lazy(() => import('@/pages/OrderTracking'));
export const LazyPrivacy = lazy(() => import('@/pages/Privacy'));
export const LazyRegister = lazy(() => import('@/pages/Register'));
export const LazyTerms = lazy(() => import('@/pages/Terms'));

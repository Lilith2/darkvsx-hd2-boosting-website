# Vercel 405 Error Fix Guide

## Issues Fixed ✅

### 1. Hardcoded localhost URL in test-payment-fix.js

- **Problem**: `http://localhost:3000/api/stripe/create-payment-intent`
- **Fix**: Changed to relative URL `/api/stripe/create-payment-intent`

### 2. Domain Inconsistencies

- **Problem**: Mixed domains (helldivers-boost.com vs helldivers2boost.com)
- **Fix**: Standardized to use `NEXT_PUBLIC_SITE_URL` environment variable

### 3. Missing Environment Variables on Vercel

## Required Vercel Environment Variables

Set these in your Vercel dashboard (Project → Settings → Environment Variables):

```
NEXT_PUBLIC_SITE_URL=https://hellboost.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RvPHJK2UdqUm5lUJBDOFvP4HCpMaLNlQVnZCBg7frTXkCHYeTSPKGFzmTHHudVvCdMofdqiRepwYRiyr2PpWFWo00NKBQrZVm
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_bSk9XaelQRi31111CNbe7fWJzldQ7shu
NEXT_PUBLIC_SUPABASE_URL=https://ahqqptrclqtwqjgmtesv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Quick Test for 405 Error

After deployment, test these URLs directly in browser:

1. **Should return 405** (correct behavior):

   ```
   https://hellboost.vercel.app/api/stripe/create-payment-intent
   ```

2. **Should return 200** with ping response:

   ```
   https://hellboost.vercel.app/api/ping
   ```

3. **Should return 405** (correct - POST only):
   ```
   https://hellboost.vercel.app/api/stripe/webhook
   ```

## Deployment Steps

1. **Set Environment Variables** in Vercel dashboard
2. **Redeploy** your application
3. **Update Stripe Webhook URL** to: `https://hellboost.vercel.app/api/stripe/webhook`
4. **Test payment flow** on production

## Common 405 Causes on Vercel

- ✅ **Fixed**: Hardcoded localhost URLs
- ✅ **Fixed**: Missing environment variables
- ✅ **Fixed**: Domain inconsistencies
- ⚠️ **Check**: Stripe webhook endpoint URL in dashboard
- ⚠️ **Check**: CORS headers (handled automatically by Next.js API routes)

## If Still Getting 405

1. Check Vercel function logs in dashboard
2. Verify all environment variables are set
3. Ensure Stripe webhook URL points to production domain
4. Test API endpoints directly with correct HTTP methods

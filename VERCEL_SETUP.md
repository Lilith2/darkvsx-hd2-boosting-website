# Vercel Deployment Setup

## 🚀 Quick Setup for hellboost.vercel.app

### 1. Environment Variables

In your Vercel dashboard, go to: **Settings** → **Environment Variables**

Add these **exact** values:

```bash
NEXT_PUBLIC_SITE_URL=https://hellboost.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RvPHJK2UdqUm5lUJBDOFvP4HCpMaLNlQVnZCBg7frTXkCHYeTSPKGFzmTHHudVvCdMofdqiRepwYRiyr2PpWFWo00NKBQrZVm
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_bSk9XaelQRi31111CNbe7fWJzldQ7shu
NEXT_PUBLIC_SUPABASE_URL=https://ahqqptrclqtwqjgmtesv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM0Mzc1MywiZXhwIjoyMDY5OTE5NzUzfQ._x3WRpU9q2Wxlynp91tf6znUMEYiHmn1kejxf4dFPmY
```

### 2. Stripe Webhook Configuration

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint** or edit existing endpoint
3. **Endpoint URL**: `https://hellboost.vercel.app/api/stripe/webhook`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.processing`
   - `payment_intent.requires_action`
   - `payment_intent.canceled`
5. **Save** and copy the webhook secret (already configured above)

### 3. Deploy

1. Push your code changes to trigger a deployment
2. Wait for deployment to complete
3. Test the endpoints below

### 4. Test Your Deployment

#### ✅ These should return **405 Method Not Allowed** (correct):

- https://hellboost.vercel.app/api/stripe/create-payment-intent
- https://hellboost.vercel.app/api/stripe/webhook

#### ✅ This should return **200 OK** with ping response:

- https://hellboost.vercel.app/api/ping

#### ✅ Test payment flow:

1. Go to https://hellboost.vercel.app
2. Add items to cart
3. Proceed to checkout
4. Test with Stripe test card: `4242 4242 4242 4242`

### 5. Common Issues

If you get **405 errors**:

- ✅ **Fixed**: Hardcoded localhost URLs
- ✅ **Fixed**: Environment variables
- ⚠️ **Check**: Webhook URL in Stripe Dashboard
- ⚠️ **Check**: All env vars are set in Vercel

If payment fails:

- Check Stripe Dashboard for webhook delivery status
- Check Vercel function logs
- Verify all environment variables are set correctly

### 6. Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Stripe webhook endpoint updated
- [ ] Test payment with real card
- [ ] Check webhook deliveries in Stripe Dashboard
- [ ] Monitor Vercel function logs

## 🎉 Your site should now work perfectly at: https://hellboost.vercel.app

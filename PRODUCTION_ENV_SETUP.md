# 🚀 Production Environment Setup - Vercel

## Critical: Set These Environment Variables in Vercel

**Go to your Vercel dashboard → Project Settings → Environment Variables and add:**

### 🔑 **Stripe Configuration (REQUIRED)**

```
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_VENMO_CAPABILITY=your_venmo_capability_id_here
```

### 🗄️ **Supabase Configuration (REQUIRED)**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here
```

### 📧 **Email Configuration (REQUIRED)**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Your Business Name
```

### 🔧 **Optional**

```
PING_MESSAGE=ping pong
```

---

## 📝 **Step-by-Step Instructions**

### 1. Access Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Login to your account
3. Find your project (helldivers-boosting or similar)
4. Click on the project

### 2. Navigate to Environment Variables

1. Click "Settings" tab
2. Click "Environment Variables" in the sidebar
3. You'll see a form to add new variables

### 3. Add Each Variable

For each environment variable above:

1. **Name**: Copy the variable name (e.g., `STRIPE_SECRET_KEY`)
2. **Value**: Copy the corresponding value
3. **Environments**: Select **Production, Preview, and Development**
4. Click "Save"

### 4. Redeploy Your Application

After adding all variables:

1. Go to "Deployments" tab
2. Click the three dots (...) on your latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

---

## ⚠️ **Security Notes**

### 🔒 **Secret Variables (Server-Only)**

These should be marked as "Secret" in Vercel:

- `STRIPE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_PASS`

### 🌐 **Public Variables**

These are safe to be public (client-side):

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🧪 **Testing After Deployment**

1. **Visit your production site**
2. **Try to make a payment** - should work without 405 errors
3. **Check browser console** - no more "undefined reading 'match'" errors
4. **Test order confirmation emails** - should send successfully

---

## 🔍 **Troubleshooting**

### If payments still fail:

1. Check Vercel function logs in dashboard
2. Verify all environment variables are set correctly
3. Ensure no typos in variable names or values

### If emails don't send:

1. Verify Gmail app password is correct
2. Check SMTP settings in Gmail account
3. Monitor Gmail account for blocked sending attempts

---

## 🎯 **Expected Results**

After setting up environment variables:

- ✅ Payment system works in production
- ✅ No more 405 Method Not Allowed errors
- ✅ No more JavaScript "undefined" errors
- ✅ Order confirmation emails send successfully
- ✅ Venmo payments available
- ✅ All Stripe payment methods working

---

## 🚨 **URGENT: Set Up Stripe Webhooks**

**You also need to configure webhooks in Stripe:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-domain.vercel.app/api/stripe/webhook`
4. **Events to send**: Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Copy the **Webhook Secret**
6. Add it to Vercel as: `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here`

This is critical for order processing and email confirmations!

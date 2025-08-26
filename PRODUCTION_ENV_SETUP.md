# 🚀 Production Environment Setup - Vercel

## Critical: Set These Environment Variables in Vercel

**Go to your Vercel dashboard → Project Settings → Environment Variables and add:**

### 🔑 **Stripe Configuration (REQUIRED)**
```
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RvPHJK2UdqUm5lUJBDOFvP4HCpMaLNlQVnZCBg7frTXkCHYeTSPKGFzmTHHudVvCdMofdqiRepwYRiyr2PpWFWo00NKBQrZVm
STRIPE_VENMO_CAPABILITY=cpmt_1RzzPiK2UdqUm5lUjyssa3Tj
```

### 🗄️ **Supabase Configuration (REQUIRED)**
```
NEXT_PUBLIC_SUPABASE_URL=https://ahqqptrclqtwqjgmtesv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM0Mzc1MywiZXhwIjoyMDY5OTE5NzUzfQ._x3WRpU9q2Wxlynp91tf6znUMEYiHmn1kejxf4dFPmY
```

### 📧 **Email Configuration (REQUIRED)**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=robcatservice@gmail.com
SMTP_PASS=jipd aerq hawp ygjq
EMAIL_FROM=robcatservice@gmail.com
EMAIL_FROM_NAME=HellDivers 2 Boosting
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

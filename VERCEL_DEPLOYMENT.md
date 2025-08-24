# Vercel Deployment Guide

This project is fully configured for Vercel deployment with Stripe payments and email notifications.

## 🚀 Quick Deploy

1. **Connect to Vercel**: Click the "Deploy" button or connect your GitHub repository to Vercel
2. **Environment Variables**: Set the following in your Vercel dashboard (Settings > Environment Variables):

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ahqqptrclqtwqjgmtesv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0

# Stripe Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# SMTP Email Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=465
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=orders@yourdomain.com
EMAIL_FROM_NAME="Your Company Name"
```

### Optional Variables

```bash
# Builder.io (for content management)
VITE_PUBLIC_BUILDER_KEY=your_builder_key

# Development
PING_MESSAGE="ping pong"
```

## 📁 Project Structure for Vercel

```
pages/
├── api/                  # Next.js API routes (serverless functions)
│   ├── stripe/          # Stripe payment endpoints
│   ├── send-order-confirmation.ts  # Email notifications
│   ├── ping.ts          # Health check
│   └── demo.ts          # Demo endpoint
pages/                   # Next.js pages
.next/                   # Built application (auto-generated)
public/                  # Static assets
```

## ⚙️ Configuration Details

### Backend API Routes

- `GET /api/ping` - Health check endpoint
- `GET /api/demo` - Demo endpoint
- `POST /api/stripe/create-payment-intent` - Create Stripe payment intent
- `GET /api/stripe/confirm-payment` - Confirm payment status
- `GET /api/stripe/payment-methods` - Get available payment methods
- `POST /api/send-order-confirmation` - Send order confirmation emails

### Frontend

- Next.js application with server-side rendering
- Stripe payment integration with multiple payment methods
- Automated email notifications for orders
- Responsive design optimized for all devices

### Security Features

- Content Security Policy headers
- CSRF protection
- XSS protection headers
- Secure cookie handling
- Environment variable validation
- Stripe webhook signature verification

### Payment Security

- PCI DSS compliant through Stripe
- No payment data stored on your servers
- Secure payment processing with 3D Secure support
- Real-time fraud detection

## 🔧 Build Process

Vercel will automatically:

1. Run `npm install` to install dependencies
2. Run `npm run build` to build the Next.js application
3. Deploy serverless functions for API routes
4. Serve the static and dynamic content globally

## 🌐 Environment Variables Setup

### Step-by-Step Setup

1. **Stripe Configuration:**
   - Get your API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Set up webhooks pointing to `https://yourdomain.com/api/stripe/webhook`
   - Copy the webhook secret

2. **SMTP Configuration:**
   - Choose an email provider (Gmail, SendGrid, Mailgun, etc.)
   - Get your SMTP credentials
   - Set the `EMAIL_FROM` to a verified sender address

3. **Supabase Configuration:**
   - Already configured with the provided keys
   - Update if using a different Supabase project

### Environment Variable Security

- Never commit secret keys to your repository
- Use production keys for live deployment
- Regularly rotate API keys
- Monitor usage in your provider dashboards

## 🔄 Custom Domains

After deployment:

1. Add custom domains in Vercel dashboard
2. Update Stripe webhook URLs to use your custom domain
3. Update `EMAIL_FROM` to use your custom domain if needed
4. Configure DNS records as instructed by Vercel

## 🐛 Troubleshooting

### Common Issues

1. **Payment Failures:**
   - Check Stripe dashboard for payment details
   - Verify webhook endpoints are receiving events
   - Check API keys are correct and active

2. **Email Issues:**
   - Verify SMTP credentials in your provider dashboard
   - Check `EMAIL_FROM` is authorized to send emails
   - Monitor email delivery rates

3. **Build Failures:**
   - Check environment variables are set correctly
   - Review build logs in Vercel dashboard
   - Ensure all required dependencies are installed

4. **API Route Errors:**
   - Check function logs in Vercel dashboard
   - Verify environment variables are accessible
   - Test endpoints individually

### Debug Endpoints

- `GET /api/ping` - Test if API is working
- `GET /api/stripe/payment-methods` - Test Stripe connection
- Check browser network tab for detailed error responses

## 📊 Performance Optimizations

The build includes:

- **Code Splitting:** Automatic code splitting by Next.js
- **Image Optimization:** Next.js automatic image optimization
- **Caching:** Intelligent caching of static and dynamic content
- **CDN:** Global content delivery through Vercel Edge Network
- **Compression:** Automatic gzip/brotli compression
- **Tree Shaking:** Unused code elimination

## 🔒 Security Checklist

- [ ] Stripe API keys configured (production keys for live site)
- [ ] Webhook signatures verified
- [ ] SMTP credentials secured
- [ ] Environment variables not exposed to client
- [ ] HTTPS enforced
- [ ] Content Security Policy headers active

## 📈 Monitoring

### Payment Monitoring
- Monitor payments in Stripe Dashboard
- Set up Stripe webhooks for payment events
- Track successful vs failed payments

### Email Monitoring
- Monitor email delivery rates with your SMTP provider
- Set up alerts for email sending failures
- Track order confirmation email open rates

### Application Monitoring
- Use Vercel Analytics for performance insights
- Monitor function execution times
- Track error rates in Vercel dashboard

## 🎮 Your Helldivers 2 Boosting Site Features

✅ **Secure Stripe Payments** - Multiple payment methods supported  
✅ **Email Notifications** - Automated order confirmations  
✅ **User Authentication** - Secure user accounts via Supabase  
✅ **Order Management** - Complete order processing system  
✅ **Admin Dashboard** - Order and user management  
✅ **Responsive Design** - Mobile-optimized experience  
✅ **SEO Optimized** - Search engine friendly  
✅ **Global CDN** - Fast loading worldwide  

Your professional boosting website is ready for production with enterprise-grade payment processing and email delivery!

# Helldivers 2 Boosting Website - Deployment Guide

## 🚀 Vercel Deployment

This project is configured for seamless deployment on Vercel with Stripe payment processing and SMTP email delivery.

### Prerequisites

- Vercel account linked to your GitHub repository
- Supabase project with the database schema set up
- Stripe account with API keys
- SMTP email service (Gmail, SendGrid, Mailgun, etc.)

### Environment Variables Required

Set these in your Vercel project settings or your local `.env.local` file:

#### Required for Basic Functionality

```bash
# Supabase Configuration (Public Keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe Configuration (Required for Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# SMTP Email Configuration (Required for Order Confirmations)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=465
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=orders@yourdomain.com
EMAIL_FROM_NAME="Your Company Name"
```

#### Optional Variables

```bash
# Builder.io (for content management)
VITE_PUBLIC_BUILDER_KEY=your_builder_key

# Development/Testing
PING_MESSAGE="ping pong"

# Advanced: Server-side Supabase access
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### SMTP Provider Setup Examples

#### Gmail (Recommended for Small Volume)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # Use App Password, not regular password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME="Your Business Name"
```

**Gmail Setup:**

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the 16-character app password as `SMTP_PASS`

#### SendGrid (Recommended for Production)

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key
EMAIL_FROM=orders@yourdomain.com
EMAIL_FROM_NAME="Your Business Name"
```

#### Mailgun

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your_domain.mailgun.org
SMTP_PASS=your_mailgun_smtp_password
EMAIL_FROM=orders@yourdomain.com
EMAIL_FROM_NAME="Your Business Name"
```

#### Amazon SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
EMAIL_FROM=orders@yourdomain.com
EMAIL_FROM_NAME="Your Business Name"
```

### Stripe Setup

1. **Create Stripe Account:** Sign up at [stripe.com](https://stripe.com)
2. **Get API Keys:** Dashboard → Developers → API keys
   - Copy your Publishable key (`pk_test_...` or `pk_live_...`)
   - Copy your Secret key (`sk_test_...` or `sk_live_...`)
3. **Setup Webhooks:** Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret (`whsec_...`)

### Deployment Steps

1. **Import to Vercel:**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect it as a Next.js project

2. **Configure Build Settings:**

   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables:**

   - Go to Project Settings → Environment Variables
   - Add all the required variables listed above
   - **Important:** Use production keys for live deployment

4. **Deploy:**
   - Click "Deploy" and Vercel will build and deploy your site
   - Your site will be available at `https://your-project-name.vercel.app`

### Features Enabled

✅ **React/Next.js App** - Server-side rendering with client-side routing  
✅ **Stripe Integration** - Secure payment processing  
✅ **Supabase Database** - User authentication and data storage  
✅ **SMTP Email** - Order confirmation emails  
✅ **Responsive Design** - Mobile-first design  
✅ **SEO Optimized** - Meta tags and proper routing  
✅ **Security Headers** - XSS protection, content security  
✅ **Fast Loading** - Optimized builds and caching

### Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Verify Stripe payments work in production
- [ ] Test order confirmation emails are sent
- [ ] Check all service filtering functionality
- [ ] Test cart and checkout flow
- [ ] Verify Discord links work (if applicable)
- [ ] Test contact form submission
- [ ] Check admin dashboard functionality
- [ ] Test webhook endpoints respond correctly

### Security Considerations

1. **Environment Variables:**

   - Never commit secret keys to your repository
   - Use different keys for development and production
   - Regularly rotate API keys

2. **Stripe Webhooks:**

   - Always verify webhook signatures
   - Use HTTPS endpoints for webhooks
   - Handle duplicate events properly

3. **Email Security:**
   - Use app passwords instead of account passwords
   - Implement rate limiting for email sending
   - Validate email addresses before sending

### Custom Domain (Optional)

To use a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed by Vercel
4. Update your Stripe webhook URL to use the custom domain

### Monitoring

- Monitor deployments in the Vercel dashboard
- Check function logs for any API issues
- Use Vercel Analytics for performance insights
- Monitor Stripe dashboard for payment issues
- Track email delivery rates in your SMTP provider

### Troubleshooting

#### Payment Issues

- Check Stripe dashboard for failed payments
- Verify webhook endpoints are receiving events
- Test with Stripe test cards

#### Email Issues

- Check SMTP credentials are correct
- Verify `EMAIL_FROM` is authorized by your provider
- Test SMTP connection with your provider's tools

#### Database Issues

- Check Supabase dashboard for connection issues
- Verify row-level security policies are correct
- Monitor database logs for errors

## 🎮 Your Helldivers 2 Boosting Site is Ready!

Your professional boosting website is now live with:

- Secure Stripe payment processing
- Automated order confirmation emails
- User authentication and profiles
- Service management system
- Professional responsive design
- Global CDN delivery through Vercel

For technical support, refer to the documentation or check the application logs in your Vercel dashboard.

# Helldivers 2 Boosting Website - Deployment Guide

## 🚀 Vercel Deployment

This project is configured for seamless deployment on Vercel.

### Prerequisites

- Vercel account linked to your GitHub repository
- Supabase project with the database schema set up
- PayPal developer account with API credentials

### Environment Variables Required

Set these in your Vercel project settings:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://ahqqptrclqtwqjgmtesv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0

# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=AefD8SednJLcqfFDsiO9AetjGEsCMVPYSCp-gX-UmUyJsQvSUHgbhnl39ZJCB14Tq-eXM3kG2Q6aizB8
```

### Deployment Steps

1. **Import to Vercel:**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect it as a Vite project

2. **Configure Build Settings:**

   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist/spa`
   - Install Command: `npm install`

3. **Add Environment Variables:**

   - Go to Project Settings → Environment Variables
   - Add all the variables listed above

4. **Deploy:**
   - Click "Deploy" and Vercel will build and deploy your site
   - Your site will be available at `https://your-project-name.vercel.app`

### Features Enabled

✅ **React SPA** - Single Page Application with client-side routing  
✅ **PayPal Integration** - Real payment processing  
✅ **Supabase Database** - User authentication and data storage  
✅ **Responsive Design** - Mobile-first design  
✅ **SEO Optimized** - Meta tags and proper routing  
✅ **Security Headers** - XSS protection, content security  
✅ **Fast Loading** - Optimized builds and caching

### Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Verify PayPal payments work in production
- [ ] Check all service filtering functionality
- [ ] Test cart and checkout flow
- [ ] Verify Discord links work
- [ ] Test contact form submission
- [ ] Check admin dashboard (if applicable)

### Custom Domain (Optional)

To use a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed by Vercel

### Monitoring

- Monitor deployments in the Vercel dashboard
- Check function logs for any API issues
- Use Vercel Analytics for performance insights

## 🎮 Your Helldivers 2 Boosting Site is Ready!

Your professional boosting website is now live with:

- Secure payment processing
- User authentication
- Service management
- Professional design
- Global CDN delivery

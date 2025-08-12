# Vercel Deployment Guide

This project is fully configured for Vercel deployment with the following setup:

## 🚀 Quick Deploy

1. **Connect to Vercel**: Click the "Deploy" button or connect your GitHub repository to Vercel
2. **Environment Variables**: Set the following in your Vercel dashboard (Settings > Environment Variables):
   - `VITE_SUPABASE_URL` - Your Supabase project URL (already configured)
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (already configured)
   - `VITE_APP_URL` - Your Vercel deployment URL (set after first deploy)
   - Any additional PayPal or other service keys as needed

## 📁 Project Structure for Vercel

```
api/
├── index.ts              # Serverless function handling all /api/* routes
vercel.json               # Vercel configuration
dist/spa/                 # Built frontend (auto-generated)
```

## ⚙️ Configuration Details

### Backend API

- All Express.js routes are handled through a single serverless function at `api/index.ts`
- Routes available:
  - `GET /api/ping` - Health check
  - `GET /api/demo` - Demo endpoint
  - `POST /api/send-email` - Email sending

### Frontend

- React SPA built with Vite
- Output directory: `dist/spa`
- All client-side routes handled by React Router

### Security Headers

- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN (optimized for Vercel preview)
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Caching

- Static assets cached for 1 year with immutable flag
- Proper cache-busting through Vite's hash-based filenames

## 🔧 Build Process

Vercel will automatically:

1. Run `npm install`
2. Run `npm run build` (builds the Vite frontend to `dist/spa`)
3. Deploy the serverless function from `api/index.ts`
4. Serve static files from `dist/spa`

## 🌐 Environment Variables

The following environment variables are already configured in your `.env` file and should be set in Vercel:

### Public Variables (safe to commit)

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_APP_URL` - Your application URL

### Optional Variables

- `VITE_PAYPAL_CLIENT_ID` - If using PayPal integration
- `VITE_PUBLIC_BUILDER_KEY` - If using Builder.io

## 🔄 Custom Domains

After deployment, you can:

1. Add custom domains in Vercel dashboard
2. Update `VITE_APP_URL` environment variable to match your custom domain
3. Redeploy to apply changes

## 🐛 Troubleshooting

### Common Issues

1. **API Routes Not Working**: Ensure `/api/*` requests are being made with the correct path
2. **Environment Variables**: Double-check all environment variables are set in Vercel dashboard
3. **Build Failures**: Check build logs in Vercel dashboard for specific errors

### Debug Endpoints

- `GET /api/ping` - Test if API is working
- Check browser network tab for API request/response details

## 📊 Performance

The build is optimized with:

- Code splitting by vendor libraries
- Terser minification
- Tree shaking
- Asset optimization
- Lazy loading for large libraries

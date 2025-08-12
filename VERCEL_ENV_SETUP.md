# 🔧 Vercel Environment Variables Setup

## Issue Identified
The website works fine in Builder.io preview but customer/admin dashboards don't load data correctly on Vercel. This is likely due to environment variables not being set properly in Vercel.

## Required Environment Variables for Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

### 1. Supabase Configuration
```
VITE_SUPABASE_URL = https://ahqqptrclqtwqjgmtesv.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0
```

### 2. Application URLs (set these after deployment)
```
VITE_APP_URL = https://your-vercel-app.vercel.app
VITE_SITE_URL = https://your-vercel-app.vercel.app
```

## Steps to Fix

### 1. Set Environment Variables in Vercel
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the variables above
5. Set them for all environments (Production, Preview, Development)

### 2. Redeploy
After setting the environment variables, trigger a new deployment:
1. Go to Deployments tab
2. Click the 3 dots on the latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger automatic deployment

### 3. Test Database Connection
After redeployment, check the database status component that shows:
- Environment variables are loaded correctly
- Database connection is working
- Tables exist and are accessible

## Debug Information Added

I've added a `DatabaseStatus` component to both dashboards that shows:
- Current environment (production/preview/development)
- Supabase URL being used
- Connection status
- Table existence
- Read access permissions
- Any error messages

This will help identify exactly what's wrong with the database connection on Vercel.

## Common Issues

### 1. Environment Variables Not Set
- Vercel requires explicit environment variable configuration
- Variables set in `.env` files are not automatically available in production

### 2. Wrong Environment Scope
- Make sure environment variables are set for "Production" environment
- Also set for "Preview" and "Development" if you want them to work there

### 3. Caching Issues
- Vercel might cache the old build without environment variables
- Force a new deployment after setting variables

### 4. Database Access Issues
- Check if Supabase has any IP restrictions
- Verify the anon key has proper permissions
- Check if RLS (Row Level Security) policies are blocking data access

## After Fixing

Once environment variables are properly set in Vercel:
1. The DatabaseStatus component should show "Connected" status
2. Customer dashboard should load user orders and profile data
3. Admin dashboard should load all orders and customer information
4. Remove the DatabaseStatus component from both dashboards (it's just for debugging)

## Contact Support

If the issue persists after setting environment variables:
1. Check the browser console for JavaScript errors
2. Check Vercel function logs for server-side errors
3. Verify Supabase logs for database connection issues

-- Remove the auto-confirm trigger and function that's causing automatic email verification
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user() CASCADE;

-- Add IP address column to orders table for chargeback protection
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_address inet;
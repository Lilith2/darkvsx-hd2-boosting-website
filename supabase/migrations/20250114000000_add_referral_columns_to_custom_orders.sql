-- Add referral columns to custom_orders table for consistency with orders table
ALTER TABLE custom_orders 
ADD COLUMN IF NOT EXISTS referral_code text,
ADD COLUMN IF NOT EXISTS referral_discount numeric(10,2),
ADD COLUMN IF NOT EXISTS referral_credits_used numeric(10,2);

-- Add customer_name column which is also used in verify-and-create
ALTER TABLE custom_orders
ADD COLUMN IF NOT EXISTS customer_name text;

-- Create indexes for better performance on referral queries
CREATE INDEX IF NOT EXISTS idx_custom_orders_referral_code ON custom_orders(referral_code);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_email ON custom_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_name ON custom_orders(customer_name);

-- Update RLS policies to include new columns (existing policies already cover these)
-- No additional policies needed as existing ones cover all columns

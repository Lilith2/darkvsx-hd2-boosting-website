# Referral System Test Plan

## Current Issues Found

1. **Missing Database Columns**: The profiles table is missing these required columns:
   - `credit_balance DECIMAL(10,2) DEFAULT 0.00`
   - `total_credits_earned DECIMAL(10,2) DEFAULT 0.00` 
   - `total_credits_used DECIMAL(10,2) DEFAULT 0.00`

2. **Missing Database Functions**: We need these functions to be created:
   - `use_referral_credits(p_user_id, p_amount, p_order_id, p_description)`
   - `add_referral_credits(p_user_id, p_amount, p_referral_id, p_description)`
   - `process_referral_reward(p_order_id, p_referral_code, p_order_amount)`

## Required Database Migration

```sql
-- Add credit columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_credits_earned DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_credits_used DECIMAL(10,2) DEFAULT 0.00;

-- Create function to use referral credits
CREATE OR REPLACE FUNCTION public.use_referral_credits(
    p_user_id uuid,
    p_amount numeric,
    p_order_id text DEFAULT NULL,
    p_description text DEFAULT 'Credits used for order'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance numeric;
BEGIN
    -- Check if user exists and get current balance
    SELECT credit_balance INTO current_balance
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
    
    -- Check if user has sufficient credits
    IF current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient credits. Available: %, Requested: %', current_balance, p_amount;
    END IF;
    
    -- Deduct credits from profile
    UPDATE public.profiles
    SET 
        credit_balance = credit_balance - p_amount,
        total_credits_used = COALESCE(total_credits_used, 0) + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error using credits: %', SQLERRM;
END;
$$;

-- Create function to add referral credits
CREATE OR REPLACE FUNCTION public.add_referral_credits(
    p_user_id uuid,
    p_amount numeric,
    p_referral_id text DEFAULT NULL,
    p_description text DEFAULT 'Referral commission earned'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Add credits to profile
    UPDATE public.profiles
    SET 
        credit_balance = COALESCE(credit_balance, 0) + p_amount,
        total_credits_earned = COALESCE(total_credits_earned, 0) + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error adding credits: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.use_referral_credits(uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_referral_credits(uuid, numeric, text, text) TO authenticated;
```

## Testing Steps

1. **Apply the migration above** to add the required columns and functions
2. **Manually add some test credits** to a user profile:
   ```sql
   UPDATE public.profiles 
   SET credit_balance = 50.00, total_credits_earned = 50.00 
   WHERE id = 'YOUR_USER_ID';
   ```
3. **Test the Account page** - check if the credit balance shows up in:
   - Quick stats dashboard (Credit Balance card)
   - Referral tab (credit stats)
4. **Test the Checkout page** - verify:
   - Credits are displayed when available
   - Credits can be applied to reduce order total
   - When credits cover full amount, no PayPal payment is required
   - Order is processed successfully with credit-only payment

## Current Status

- ✅ Frontend code updated to use profile-based credits
- ✅ Checkout page updated to handle credit-only payments
- ❌ Database columns missing (need migration)
- ❌ Database functions missing (need migration)
- ❌ Testing not yet completed

## Next Steps

1. Apply the database migration
2. Test with real data
3. Verify referral rewards are properly added when orders complete

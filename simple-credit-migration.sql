-- Simple Credit System Migration
-- Only adds credit_balance column to profiles table

-- Add credit_balance column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0.00;

-- Create simple index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_credit_balance 
ON public.profiles(credit_balance) 
WHERE credit_balance > 0;

-- Simple function to add credits (for referral rewards)
CREATE OR REPLACE FUNCTION public.add_credits(
    p_user_id uuid,
    p_amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL OR p_amount <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Add credits to profile
    UPDATE public.profiles
    SET 
        credit_balance = COALESCE(credit_balance, 0) + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, numeric) TO authenticated;

-- Add RLS policy for credit_balance (security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own credit balance
CREATE POLICY IF NOT EXISTS "Users can manage own credit balance" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (auth.uid() = id);

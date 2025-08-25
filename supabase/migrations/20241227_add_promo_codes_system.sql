-- Add promo_codes table for admin-generated coupons
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_promo_usage table to track which users have used which promo codes
CREATE TABLE IF NOT EXISTS user_promo_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  promo_code TEXT NOT NULL,
  order_id UUID,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  discount_amount DECIMAL(10,2),
  UNIQUE(user_id, promo_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_user_promo_usage_user_id ON user_promo_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promo_usage_promo_code ON user_promo_usage(promo_code);

-- Update the validate_referral_code function to support both referral codes and promo codes
CREATE OR REPLACE FUNCTION validate_referral_code(code TEXT, user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    promo_record promo_codes%ROWTYPE;
    referral_record referral_codes%ROWTYPE;
    usage_exists BOOLEAN := FALSE;
BEGIN
    -- First check if it's a promo code
    SELECT * INTO promo_record 
    FROM promo_codes 
    WHERE promo_codes.code = validate_referral_code.code 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF FOUND THEN
        -- Check if user has already used this promo code
        IF user_id IS NOT NULL THEN
            SELECT EXISTS(
                SELECT 1 FROM user_promo_usage 
                WHERE user_promo_usage.user_id = validate_referral_code.user_id 
                AND user_promo_usage.promo_code = validate_referral_code.code
            ) INTO usage_exists;
            
            IF usage_exists THEN
                result := json_build_object(
                    'valid', false,
                    'error', 'You have already used this promo code'
                );
                RETURN result;
            END IF;
        END IF;
        
        -- Check if promo code has reached max uses
        IF promo_record.max_uses IS NOT NULL AND promo_record.current_uses >= promo_record.max_uses THEN
            result := json_build_object(
                'valid', false,
                'error', 'This promo code has reached its usage limit'
            );
            RETURN result;
        END IF;
        
        result := json_build_object(
            'valid', true,
            'code', promo_record.code,
            'type', 'promo',
            'discount_type', promo_record.discount_type,
            'discount_value', promo_record.discount_value
        );
        RETURN result;
    END IF;
    
    -- If not a promo code, check if it's a referral code
    SELECT * INTO referral_record 
    FROM referral_codes 
    WHERE referral_codes.code = validate_referral_code.code 
    AND (is_active IS NULL OR is_active = true);
    
    IF FOUND THEN
        -- Check if user has already used this referral code
        IF user_id IS NOT NULL THEN
            SELECT EXISTS(
                SELECT 1 FROM user_referral_usage 
                WHERE user_referral_usage.user_id = validate_referral_code.user_id 
                AND user_referral_usage.referral_code = validate_referral_code.code
            ) INTO usage_exists;
            
            IF usage_exists THEN
                result := json_build_object(
                    'valid', false,
                    'error', 'You have already used this referral code'
                );
                RETURN result;
            END IF;
        END IF;
        
        -- Check if referral code has reached max uses
        IF referral_record.max_uses IS NOT NULL AND referral_record.uses_count >= referral_record.max_uses THEN
            result := json_build_object(
                'valid', false,
                'error', 'This referral code has reached its usage limit'
            );
            RETURN result;
        END IF;
        
        result := json_build_object(
            'valid', true,
            'code', referral_record.code,
            'type', 'referral',
            'referrer_id', referral_record.owner_user_id
        );
        RETURN result;
    END IF;
    
    -- Code not found
    result := json_build_object(
        'valid', false,
        'error', 'Invalid code'
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the apply_referral_discount function to handle both referral and promo codes
CREATE OR REPLACE FUNCTION apply_referral_discount(order_id UUID, referral_code TEXT, user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    validation_result JSON;
    discount_amount DECIMAL(10,2) := 0;
    commission_amount DECIMAL(10,2) := 0;
    order_total DECIMAL(10,2) := 0;
    promo_record promo_codes%ROWTYPE;
    referral_record referral_codes%ROWTYPE;
BEGIN
    -- First validate the code
    SELECT validate_referral_code(referral_code, user_id) INTO validation_result;
    
    IF NOT (validation_result->>'valid')::boolean THEN
        RETURN validation_result;
    END IF;
    
    -- Get order total (you may need to adjust this based on your order structure)
    -- This is a placeholder - adjust based on your actual order table structure
    SELECT 100.00 INTO order_total; -- This should be replaced with actual order total lookup
    
    IF (validation_result->>'type') = 'promo' THEN
        -- Handle promo code
        SELECT * INTO promo_record 
        FROM promo_codes 
        WHERE code = referral_code;
        
        IF promo_record.discount_type = 'percentage' THEN
            discount_amount := order_total * (promo_record.discount_value / 100);
        ELSE
            discount_amount := promo_record.discount_value;
        END IF;
        
        -- Record usage
        INSERT INTO user_promo_usage (user_id, promo_code, order_id, discount_amount)
        VALUES (user_id, referral_code, apply_referral_discount.order_id, discount_amount)
        ON CONFLICT (user_id, promo_code) DO NOTHING;
        
        -- Update usage count
        UPDATE promo_codes 
        SET current_uses = current_uses + 1, updated_at = NOW()
        WHERE code = referral_code;
        
    ELSE
        -- Handle referral code with updated rates (15% discount, 10% commission)
        discount_amount := order_total * 0.15; -- 15% discount for customer
        commission_amount := order_total * 0.10; -- 10% commission for referrer
        
        SELECT * INTO referral_record 
        FROM referral_codes 
        WHERE code = referral_code;
        
        -- Record referral transaction
        INSERT INTO referral_transactions (
            referral_code, 
            referrer_user_id, 
            referred_user_id, 
            order_id, 
            commission_amount, 
            discount_amount,
            status
        ) VALUES (
            referral_code,
            referral_record.owner_user_id,
            user_id,
            apply_referral_discount.order_id,
            commission_amount,
            discount_amount,
            'pending'
        );
        
        -- Record usage to prevent reuse
        INSERT INTO user_referral_usage (user_id, referral_code, order_id)
        VALUES (user_id, referral_code, apply_referral_discount.order_id)
        ON CONFLICT (user_id, referral_code) DO NOTHING;
        
        -- Update referral code usage count
        UPDATE referral_codes 
        SET uses_count = COALESCE(uses_count, 0) + 1, updated_at = NOW()
        WHERE code = referral_code;
        
        -- Add commission to referrer's credit balance
        INSERT INTO credit_transactions (
            user_id, 
            amount, 
            transaction_type, 
            description,
            referral_transaction_id
        ) VALUES (
            referral_record.owner_user_id,
            commission_amount,
            'credit',
            'Referral commission',
            (SELECT id FROM referral_transactions WHERE referral_code = apply_referral_discount.referral_code AND order_id = apply_referral_discount.order_id ORDER BY created_at DESC LIMIT 1)
        );
        
        -- Update referrer's profile credit balance
        INSERT INTO profiles (id, credit_balance) 
        VALUES (referral_record.owner_user_id, commission_amount)
        ON CONFLICT (id) 
        DO UPDATE SET 
            credit_balance = COALESCE(profiles.credit_balance, 0) + commission_amount,
            updated_at = NOW();
    END IF;
    
    result := json_build_object(
        'success', true,
        'discount_amount', discount_amount,
        'commission_amount', COALESCE(commission_amount, 0),
        'type', validation_result->>'type'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for promo_codes table
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Admin users can manage promo codes
CREATE POLICY "Admin can manage promo codes" ON promo_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- All authenticated users can read active promo codes
CREATE POLICY "Users can read active promo codes" ON promo_codes
    FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Add RLS policies for user_promo_usage table
ALTER TABLE user_promo_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can see own promo usage" ON user_promo_usage
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own usage records
CREATE POLICY "Users can insert own promo usage" ON user_promo_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin can see all usage
CREATE POLICY "Admin can see all promo usage" ON user_promo_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add referral tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_discount numeric(10,2) DEFAULT 0;

-- Create referrals table to track referral stats
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid REFERENCES auth.users(id) NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id),
  referral_code text NOT NULL,
  order_id uuid REFERENCES orders(id),
  commission_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_orders_referral ON orders(referral_code);

-- Create unique constraint to prevent users from using multiple referral codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_one_per_user ON referrals(referred_user_id)
WHERE referred_user_id IS NOT NULL;

-- Enable RLS (Row Level Security)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for referrals table
CREATE POLICY "Users can view their own referrals as referrer" ON referrals
  FOR SELECT USING (referrer_user_id = auth.uid());

CREATE POLICY "Users can view their own referrals as referred" ON referrals
  FOR SELECT USING (referred_user_id = auth.uid());

-- Create a function to automatically create referral record when order with referral code is placed
CREATE OR REPLACE FUNCTION handle_referral_order()
RETURNS trigger AS $$
DECLARE
  referrer_id uuid;
BEGIN
  -- Only process if order has a referral code and positive discount
  IF NEW.referral_code IS NOT NULL AND NEW.referral_discount > 0 THEN
    -- Extract user ID from referral code (HD2BOOST-XXXXXX format)
    SELECT id INTO referrer_id 
    FROM auth.users 
    WHERE RIGHT(id::text, 6) = RIGHT(NEW.referral_code, 6) 
    AND NEW.referral_code LIKE 'HD2BOOST-%';
    
    -- If referrer found and it's not the same user
    IF referrer_id IS NOT NULL AND referrer_id != NEW.user_id THEN
      -- Update order with referrer ID
      UPDATE orders 
      SET referred_by_user_id = referrer_id 
      WHERE id = NEW.id;
      
      -- Create referral record
      INSERT INTO referrals (
        referrer_user_id,
        referred_user_id,
        referral_code,
        order_id,
        commission_amount,
        status
      ) VALUES (
        referrer_id,
        NEW.user_id,
        NEW.referral_code,
        NEW.id,
        NEW.referral_discount * 0.5, -- 5% commission (10% discount * 0.5)
        CASE WHEN NEW.payment_status = 'paid' THEN 'completed' ELSE 'pending' END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral processing
DROP TRIGGER IF EXISTS trigger_handle_referral_order ON orders;
CREATE TRIGGER trigger_handle_referral_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_order();

-- Create function to update referral status when order payment status changes
CREATE OR REPLACE FUNCTION update_referral_status()
RETURNS trigger AS $$
BEGIN
  -- Update referral status based on payment status
  IF OLD.payment_status != NEW.payment_status AND NEW.referral_code IS NOT NULL THEN
    UPDATE referrals 
    SET 
      status = CASE 
        WHEN NEW.payment_status = 'paid' THEN 'completed'
        WHEN NEW.payment_status = 'failed' OR NEW.payment_status = 'refunded' THEN 'cancelled'
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral status updates
DROP TRIGGER IF EXISTS trigger_update_referral_status ON orders;
CREATE TRIGGER trigger_update_referral_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_status();

-- Create referral credits balance table
CREATE TABLE IF NOT EXISTS referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  balance numeric(10,2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
  total_earned numeric(10,2) DEFAULT 0 NOT NULL,
  total_spent numeric(10,2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for referral credits
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for referral credits
CREATE POLICY "Users can view their own credits" ON referral_credits
  FOR ALL USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_referral_credits_user ON referral_credits(user_id);

-- Function to initialize user's referral credits
CREATE OR REPLACE FUNCTION initialize_user_credits(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO referral_credits (user_id, balance, total_earned, total_spent)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits when referral is completed
CREATE OR REPLACE FUNCTION add_referral_credits()
RETURNS trigger AS $$
BEGIN
  -- Only add credits when referral status changes to completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.commission_amount > 0 THEN
    -- Initialize credits for user if not exists
    PERFORM initialize_user_credits(NEW.referrer_user_id);
    
    -- Add credits to referrer's balance
    UPDATE referral_credits 
    SET 
      balance = balance + NEW.commission_amount,
      total_earned = total_earned + NEW.commission_amount,
      updated_at = now()
    WHERE user_id = NEW.referrer_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add credits when referral is completed
DROP TRIGGER IF EXISTS trigger_add_referral_credits ON referrals;
CREATE TRIGGER trigger_add_referral_credits
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION add_referral_credits();

-- Function to deduct credits when they are used
CREATE OR REPLACE FUNCTION deduct_referral_credits()
RETURNS trigger AS $$
BEGIN
  -- If order uses referral credits and payment is successful, deduct from balance
  IF NEW.referral_credits_used > 0 AND NEW.payment_status = 'paid' THEN
    -- Initialize credits for user if not exists
    PERFORM initialize_user_credits(NEW.user_id);
    
    -- Deduct credits from user's balance
    UPDATE referral_credits 
    SET 
      balance = GREATEST(0, balance - NEW.referral_credits_used),
      total_spent = total_spent + NEW.referral_credits_used,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to deduct credits when they are used
DROP TRIGGER IF EXISTS trigger_deduct_referral_credits ON orders;
CREATE TRIGGER trigger_deduct_referral_credits
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION deduct_referral_credits();

-- Function to get user's referral credit balance
CREATE OR REPLACE FUNCTION get_user_referral_credits(p_user_id uuid)
RETURNS numeric AS $$
DECLARE
  user_balance numeric(10,2);
BEGIN
  -- Initialize credits for user if not exists
  PERFORM initialize_user_credits(p_user_id);
  
  -- Get user's current balance
  SELECT balance INTO user_balance
  FROM referral_credits
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(user_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has enough credits
CREATE OR REPLACE FUNCTION user_has_sufficient_credits(p_user_id uuid, p_amount numeric)
RETURNS boolean AS $$
DECLARE
  user_balance numeric(10,2);
BEGIN
  user_balance := get_user_referral_credits(p_user_id);
  RETURN user_balance >= p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for referral stats (for easier querying)
CREATE OR REPLACE VIEW user_referral_stats AS
SELECT 
  u.id as user_id,
  COALESCE(rc.balance, 0) as current_balance,
  COALESCE(rc.total_earned, 0) as total_earned,
  COALESCE(rc.total_spent, 0) as total_spent,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as successful_referrals,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals,
  SUM(CASE WHEN r.status = 'pending' THEN r.commission_amount ELSE 0 END) as pending_earnings
FROM auth.users u
LEFT JOIN referral_credits rc ON rc.user_id = u.id
LEFT JOIN referrals r ON r.referrer_user_id = u.id
GROUP BY u.id, rc.balance, rc.total_earned, rc.total_spent;

-- Grant necessary permissions
GRANT SELECT ON user_referral_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referral_credits TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_credits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_sufficient_credits(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_credits(uuid) TO authenticated;

-- Create custom pricing table for dynamic pricing system
CREATE TABLE IF NOT EXISTS custom_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  item_name text NOT NULL,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  price_per_unit numeric(10,2) NOT NULL DEFAULT 0,
  minimum_quantity integer NOT NULL DEFAULT 1,
  maximum_quantity integer NOT NULL DEFAULT 100,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON custom_pricing
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users to read all" ON custom_pricing
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify" ON custom_pricing
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_pricing_category ON custom_pricing(category);
CREATE INDEX IF NOT EXISTS idx_custom_pricing_active ON custom_pricing(is_active);

-- Insert default pricing data
INSERT INTO custom_pricing (category, item_name, base_price, price_per_unit, minimum_quantity, maximum_quantity, description, is_active) VALUES
('medals', 'Medal', 5.00, 5.00, 1, 50, 'Unlock and complete medal challenges', true),
('levels', 'Level', 8.00, 8.00, 1, 100, 'Character level progression', true),
('samples', 'Sample', 2.00, 2.00, 10, 1000, 'Collect rare samples for upgrades', true),
('super_credits', 'Super Credit', 0.50, 0.50, 100, 5000, 'Premium currency for exclusive items', true)
ON CONFLICT DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_custom_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_custom_pricing_updated_at ON custom_pricing;
CREATE TRIGGER update_custom_pricing_updated_at
  BEFORE UPDATE ON custom_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_pricing_updated_at();

-- Grant necessary permissions
GRANT SELECT ON custom_pricing TO anon;
GRANT ALL ON custom_pricing TO authenticated;

-- Create custom_orders table to store completed custom orders
CREATE TABLE IF NOT EXISTS custom_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  items jsonb NOT NULL DEFAULT '[]',
  special_instructions text,
  customer_email text,
  customer_discord text,
  payment_intent_id text,
  delivery_status text DEFAULT 'not_started' CHECK (delivery_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  delivery_notes text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own orders" ON custom_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON custom_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON custom_orders
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can update all orders" ON custom_orders
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_orders_user_id ON custom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_order_number ON custom_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_custom_orders_created_at ON custom_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_orders_delivery_status ON custom_orders(delivery_status);

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  order_num text;
  counter int;
BEGIN
  -- Get current date in YYYYMMDD format
  order_num := 'CO' || to_char(now(), 'YYYYMMDD') || '-';
  
  -- Get count of orders created today
  SELECT COUNT(*) INTO counter
  FROM custom_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Pad with zeros and increment
  order_num := order_num || LPAD((counter + 1)::text, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order number
DROP TRIGGER IF EXISTS set_order_number_trigger ON custom_orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_custom_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_custom_orders_updated_at ON custom_orders;
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_orders_updated_at();

-- Create custom_order_items table for better normalization
CREATE TABLE IF NOT EXISTS custom_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES custom_orders(id) ON DELETE CASCADE,
  category text NOT NULL,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_per_unit numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for order items
ALTER TABLE custom_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order items
CREATE POLICY "Users can view their own order items" ON custom_order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM custom_orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items" ON custom_order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM custom_orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items" ON custom_order_items
  FOR SELECT USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can update all order items" ON custom_order_items
  FOR UPDATE USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create indexes for order items
CREATE INDEX IF NOT EXISTS idx_custom_order_items_order_id ON custom_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_custom_order_items_category ON custom_order_items(category);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON custom_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON custom_order_items TO authenticated;

-- Create view for order analytics
CREATE OR REPLACE VIEW custom_order_analytics AS
SELECT 
  DATE(created_at) as order_date,
  status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM custom_orders
GROUP BY DATE(created_at), status
ORDER BY order_date DESC;

-- Grant view access
GRANT SELECT ON custom_order_analytics TO authenticated;

-- Create function to get order statistics
CREATE OR REPLACE FUNCTION get_custom_order_stats(start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS TABLE (
  total_orders bigint,
  total_revenue numeric,
  avg_order_value numeric,
  pending_orders bigint,
  completed_orders bigint,
  most_popular_category text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_orders,
    COALESCE(SUM(co.total_amount), 0) as total_revenue,
    COALESCE(AVG(co.total_amount), 0) as avg_order_value,
    COUNT(*) FILTER (WHERE co.status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE co.status = 'completed') as completed_orders,
    (
      SELECT coi.category
      FROM custom_order_items coi
      JOIN custom_orders co2 ON coi.order_id = co2.id
      WHERE co2.created_at >= start_date
      GROUP BY coi.category
      ORDER BY SUM(coi.quantity) DESC
      LIMIT 1
    ) as most_popular_category
  FROM custom_orders co
  WHERE co.created_at >= start_date;
END;
$$ LANGUAGE plpgsql;

-- Grant function access
GRANT EXECUTE ON FUNCTION get_custom_order_stats TO authenticated;

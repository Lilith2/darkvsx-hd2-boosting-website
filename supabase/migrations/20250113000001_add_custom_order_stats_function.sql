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

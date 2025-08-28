const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ahqqptrclqtwqjgmtesv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('services')
      .select('id, title, price, active')
      .limit(5);
    
    if (error) {
      console.error('Error connecting to services table:', error);
    } else {
      console.log('✅ Services table connection successful');
      console.log('Services found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample service:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to services table:', err);
  }

  try {
    // Test orders table
    const { data, error } = await supabase
      .from('orders')
      .select('id, customer_email, status, total_amount, created_at')
      .limit(5);
    
    if (error) {
      console.error('Error connecting to orders table:', error);
    } else {
      console.log('✅ Orders table connection successful');
      console.log('Orders found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample order:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to orders table:', err);
  }

  try {
    // Test custom_orders table
    const { data, error } = await supabase
      .from('custom_orders')
      .select('id, order_number, status, total_amount, created_at')
      .limit(5);
    
    if (error) {
      console.error('Error connecting to custom_orders table:', error);
    } else {
      console.log('✅ Custom Orders table connection successful');
      console.log('Custom orders found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample custom order:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to custom_orders table:', err);
  }

  try {
    // Test bundles table
    const { data, error } = await supabase
      .from('bundles')
      .select('id, name, discounted_price, active')
      .limit(5);
    
    if (error) {
      console.error('Error connecting to bundles table:', error);
    } else {
      console.log('✅ Bundles table connection successful');
      console.log('Bundles found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample bundle:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to bundles table:', err);
  }

  try {
    // Test custom_pricing table
    const { data, error } = await supabase
      .from('custom_pricing')
      .select('id, item_name, category, price_per_unit, is_active')
      .limit(5);
    
    if (error) {
      console.error('Error connecting to custom_pricing table:', error);
    } else {
      console.log('✅ Custom Pricing table connection successful');
      console.log('Custom pricing items found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample pricing item:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to custom_pricing table:', err);
  }

  try {
    // Test profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, role, credit_balance')
      .limit(5);
    
    if (error) {
      console.error('Error connecting to profiles table:', error);
    } else {
      console.log('✅ Profiles table connection successful');
      console.log('Profiles found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample profile:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to profiles table:', err);
  }

  console.log('\n🔍 Database analysis complete!');
}

testConnection();

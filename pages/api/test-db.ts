import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results: any = {
    connection: 'testing...',
    tables: {},
    errors: [],
    summary: {
      totalTables: 0,
      tablesWithData: 0,
      totalRecords: 0
    }
  };

  try {
    console.log('Testing Supabase connection...');
    
    // Test services table
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('id, title, price, active, created_at')
        .limit(5);
      
      if (error) {
        results.errors.push(`Services table error: ${error.message}`);
        results.tables.services = { status: 'error', error: error.message };
      } else {
        results.tables.services = { 
          status: 'success', 
          count: services?.length || 0,
          sample: services?.[0] || null 
        };
        results.summary.totalRecords += services?.length || 0;
        if (services && services.length > 0) results.summary.tablesWithData++;
      }
      results.summary.totalTables++;
    } catch (err: any) {
      results.errors.push(`Services table exception: ${err.message}`);
      results.tables.services = { status: 'exception', error: err.message };
    }

    // Test orders table
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_email, status, total_amount, created_at')
        .limit(5);
      
      if (error) {
        results.errors.push(`Orders table error: ${error.message}`);
        results.tables.orders = { status: 'error', error: error.message };
      } else {
        results.tables.orders = { 
          status: 'success', 
          count: orders?.length || 0,
          sample: orders?.[0] || null 
        };
        results.summary.totalRecords += orders?.length || 0;
        if (orders && orders.length > 0) results.summary.tablesWithData++;
      }
      results.summary.totalTables++;
    } catch (err: any) {
      results.errors.push(`Orders table exception: ${err.message}`);
      results.tables.orders = { status: 'exception', error: err.message };
    }

    // Test custom_orders table
    try {
      const { data: customOrders, error } = await supabase
        .from('custom_orders')
        .select('id, order_number, status, total_amount, created_at, items')
        .limit(5);
      
      if (error) {
        results.errors.push(`Custom orders table error: ${error.message}`);
        results.tables.custom_orders = { status: 'error', error: error.message };
      } else {
        results.tables.custom_orders = { 
          status: 'success', 
          count: customOrders?.length || 0,
          sample: customOrders?.[0] || null 
        };
        results.summary.totalRecords += customOrders?.length || 0;
        if (customOrders && customOrders.length > 0) results.summary.tablesWithData++;
      }
      results.summary.totalTables++;
    } catch (err: any) {
      results.errors.push(`Custom orders table exception: ${err.message}`);
      results.tables.custom_orders = { status: 'exception', error: err.message };
    }

    // Test bundles table
    try {
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select('id, name, discounted_price, active, created_at')
        .limit(5);
      
      if (error) {
        results.errors.push(`Bundles table error: ${error.message}`);
        results.tables.bundles = { status: 'error', error: error.message };
      } else {
        results.tables.bundles = { 
          status: 'success', 
          count: bundles?.length || 0,
          sample: bundles?.[0] || null 
        };
        results.summary.totalRecords += bundles?.length || 0;
        if (bundles && bundles.length > 0) results.summary.tablesWithData++;
      }
      results.summary.totalTables++;
    } catch (err: any) {
      results.errors.push(`Bundles table exception: ${err.message}`);
      results.tables.bundles = { status: 'exception', error: err.message };
    }

    // Test custom_pricing table
    try {
      const { data: pricing, error } = await supabase
        .from('custom_pricing')
        .select('id, item_name, category, price_per_unit, is_active, created_at')
        .limit(5);
      
      if (error) {
        results.errors.push(`Custom pricing table error: ${error.message}`);
        results.tables.custom_pricing = { status: 'error', error: error.message };
      } else {
        results.tables.custom_pricing = { 
          status: 'success', 
          count: pricing?.length || 0,
          sample: pricing?.[0] || null 
        };
        results.summary.totalRecords += pricing?.length || 0;
        if (pricing && pricing.length > 0) results.summary.tablesWithData++;
      }
      results.summary.totalTables++;
    } catch (err: any) {
      results.errors.push(`Custom pricing table exception: ${err.message}`);
      results.tables.custom_pricing = { status: 'exception', error: err.message };
    }

    // Test profiles table
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, email, role, credit_balance, created_at')
        .limit(5);
      
      if (error) {
        results.errors.push(`Profiles table error: ${error.message}`);
        results.tables.profiles = { status: 'error', error: error.message };
      } else {
        results.tables.profiles = { 
          status: 'success', 
          count: profiles?.length || 0,
          sample: profiles?.[0] || null 
        };
        results.summary.totalRecords += profiles?.length || 0;
        if (profiles && profiles.length > 0) results.summary.tablesWithData++;
      }
      results.summary.totalTables++;
    } catch (err: any) {
      results.errors.push(`Profiles table exception: ${err.message}`);
      results.tables.profiles = { status: 'exception', error: err.message };
    }

    // Test referral_transactions table
    try {
      const { data: referrals, error } = await supabase
        .from('referral_transactions')
        .select('id, referral_code, referrer_user_id, commission_amount, created_at')
        .limit(5);
      
      if (error) {
        results.errors.push(`Referral transactions table error: ${error.message}`);
        results.tables.referral_transactions = { status: 'error', error: error.message };
      } else {
        results.tables.referral_transactions = { 
          status: 'success', 
          count: referrals?.length || 0,
          sample: referrals?.[0] || null 
        };
        results.summary.totalRecords += referrals?.length || 0;
        if (referrals && referrals.length > 0) results.summary.tablesWithData++;
      }
      results.summary.totalTables++;
    } catch (err: any) {
      results.errors.push(`Referral transactions table exception: ${err.message}`);
      results.tables.referral_transactions = { status: 'exception', error: err.message };
    }

    results.connection = 'success';
    results.summary.hasErrors = results.errors.length > 0;
    
    return res.status(200).json({
      message: 'Database connection test complete',
      ...results
    });

  } catch (error: any) {
    console.error('Database test failed:', error);
    return res.status(500).json({
      error: 'Database connection failed',
      details: error.message,
      ...results
    });
  }
}

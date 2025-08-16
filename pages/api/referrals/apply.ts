import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, referralCode, userId } = req.body;

    if (!orderId || !referralCode) {
      return res.status(400).json({ error: 'Order ID and referral code are required' });
    }

    // Call the secure database function
    const { data, error } = await supabase.rpc('apply_referral_discount', {
      order_id: orderId,
      referral_code: referralCode,
      user_id: userId || null
    });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

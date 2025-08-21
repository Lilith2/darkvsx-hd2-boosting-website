import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get available payment method types
    const paymentMethods = [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Visa, Mastercard, American Express',
        icon: 'credit-card',
        enabled: true,
      },
      {
        id: 'us_bank_account',
        name: 'ACH Direct Debit',
        description: 'Pay directly from your bank account',
        icon: 'bank',
        enabled: true,
      },
      {
        id: 'link',
        name: 'Link',
        description: 'Secure 1-click checkout',
        icon: 'link',
        enabled: true,
      },
      {
        id: 'cashapp',
        name: 'Cash App Pay',
        description: 'Pay with Cash App',
        icon: 'smartphone',
        enabled: true,
      },
    ];

    // Add custom payment method if available
    const customPaymentMethodId = 'cpmt_1RybC7Gre37xKT2Zf7wCtFrS';
    
    try {
      // Verify the custom payment method exists
      const customMethod = await stripe.paymentMethods.retrieve(customPaymentMethodId);
      
      paymentMethods.push({
        id: customPaymentMethodId,
        name: 'Custom Payment',
        description: 'Special payment method',
        icon: 'star',
        enabled: true,
      });
    } catch (error) {
      console.log('Custom payment method not found or not available');
    }

    res.status(200).json({ paymentMethods });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch payment methods' 
    });
  }
}

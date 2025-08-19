import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log performance metrics (in a real app, you'd save to a database)
    const metrics = req.body;
    
    // Validate that we have some metrics data
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({ error: 'Invalid metrics data' });
    }

    // Log to console for debugging (in production, you'd use a proper analytics service)
    console.log('Performance metrics received:', {
      timestamp: new Date().toISOString(),
      ...metrics
    });

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Metrics recorded successfully' 
    });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

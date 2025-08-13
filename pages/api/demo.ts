import type { NextApiRequest, NextApiResponse } from 'next';

type DemoData = {
  message: string;
  timestamp: string;
  environment: string;
  userAgent?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DemoData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      message: 'Method not allowed', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  res.status(200).json({
    message: 'Demo API endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    userAgent: req.headers['user-agent'],
  });
}

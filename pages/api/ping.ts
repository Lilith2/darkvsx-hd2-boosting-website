import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message: string;
  timestamp: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed', timestamp: new Date().toISOString() });
  }

  res.status(200).json({
    message: process.env.PING_MESSAGE || 'pong',
    timestamp: new Date().toISOString(),
  });
}

import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
  timestamp: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({
        message: "Method not allowed",
        timestamp: new Date().toISOString(),
      });
  }

  // Add caching headers - ping can be cached briefly
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30"); // Cache for 1 minute
  res.setHeader("CDN-Cache-Control", "max-age=60");

  res.status(200).json({
    message: process.env.PING_MESSAGE || "pong",
    timestamp: new Date().toISOString(),
  });
}

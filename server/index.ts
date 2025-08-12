import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSendEmail } from "./routes/email";

export function createServer() {
  const app = express();

  // Security middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com'] // Replace with your actual domain
      : true,
    credentials: true
  }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
  });

  // Body parsing with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic rate limiting for email endpoint
  const emailRequests = new Map();
  app.use('/api/send-email', (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 5; // max 5 emails per 15 minutes per IP

    if (!emailRequests.has(ip)) {
      emailRequests.set(ip, []);
    }

    const requests = emailRequests.get(ip).filter((time: number) => now - time < windowMs);

    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many email requests. Please try again later.'
      });
    }

    requests.push(now);
    emailRequests.set(ip, requests);
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Email routes
  app.post("/api/send-email", handleSendEmail);

  return app;
}

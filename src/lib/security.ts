import DOMPurify from "dompurify";
import { z } from "zod";

// Content Security Policy helpers
export const CSP_NONCES = {
  style: crypto.randomUUID(),
  script: crypto.randomUUID(),
};

// Input sanitization
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(input: string): string {
  return input.replace(/[<>'"&]/g, (char) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    };
    return entities[char] || char;
  });
}

// Email validation with additional security checks
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(5, "Email too short")
  .max(254, "Email too long")
  .refine((email) => {
    // Check for common malicious patterns
    const maliciousPatterns = [
      /javascript:/i,
      /<script/i,
      /eval\(/i,
      /\bexec\b/i,
    ];
    return !maliciousPatterns.some((pattern) => pattern.test(email));
  }, "Invalid email format");

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  );

// Phone number validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional();

// Order amount validation
export const orderAmountSchema = z
  .number()
  .min(0.01, "Amount must be positive")
  .max(10000, "Amount too high")
  .refine((amount) => {
    // Check for reasonable decimal places
    return (amount * 100) % 1 === 0;
  }, "Invalid amount format");

// Rate limiting utilities
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> =
    new Map();

  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// IP address validation
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Detect suspicious patterns in user input
export function detectSuspiciousActivity(input: string): boolean {
  const suspiciousPatterns = [
    // SQL injection patterns
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,

    // XSS patterns
    /<script.*?>.*?<\/script>/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,

    // Command injection
    /\$\(/,
    /`.*`/,
    /\|\|/,
    /&&/,

    // Path traversal
    /\.\.\//,
    /\.\.\\\\/,

    // Common attack vectors
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

// Secure token generation
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

// Content validation for orders
export const orderValidationSchema = z.object({
  customerName: z
    .string()
    .min(1, "Name required")
    .max(100, "Name too long")
    .refine((name) => !detectSuspiciousActivity(name), "Invalid name format"),

  customerEmail: emailSchema,

  services: z
    .array(
      z.object({
        id: z.string().uuid("Invalid service ID"),
        name: z.string().min(1).max(200),
        price: orderAmountSchema,
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1, "At least one service required"),

  totalAmount: orderAmountSchema,

  notes: z
    .string()
    .max(1000, "Notes too long")
    .optional()
    .refine(
      (notes) => !notes || !detectSuspiciousActivity(notes),
      "Invalid notes content",
    ),
});

// Audit logging
interface AuditEvent {
  type: "auth" | "order" | "admin" | "security";
  action: string;
  userId?: string;
  ip?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

class AuditLogger {
  private events: AuditEvent[] = [];
  private maxEvents = 1000;

  log(event: Omit<AuditEvent, "timestamp">): void {
    this.events.push({
      ...event,
      timestamp: new Date(),
    });

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(event);
    } else {
      console.log("Audit:", event);
    }
  }

  private sendToLoggingService(event: AuditEvent): void {
    // Implementation would send to your logging service
    // e.g., Sentry, LogRocket, custom endpoint
  }

  getEvents(type?: AuditEvent["type"]): AuditEvent[] {
    return type
      ? this.events.filter((event) => event.type === type)
      : this.events;
  }
}

export const auditLogger = new AuditLogger();

// Security headers validation
export function validateSecurityHeaders(headers: Headers): boolean {
  const requiredHeaders = [
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
  ];

  return requiredHeaders.every((header) => headers.has(header));
}

// Environment variable validation
export function validateEnvironment(): void {
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "VITE_PAYPAL_CLIENT_ID",
  ];

  const missing = requiredEnvVars.filter((envVar) => {
    const value = typeof window !== 'undefined' ? (window as any).process?.env?.[envVar] : process.env[envVar];
    return !value;
  });

  if (missing.length > 0) {
    console.warn("Missing environment variables:", missing);
  }
}

// Initialize security measures
export function initializeSecurity(): void {
  // Validate environment
  validateEnvironment();

  // Only run browser-specific code on client side
  if (typeof window === 'undefined') return;

  // Set up global error handling for security events
  window.addEventListener("error", (event) => {
    auditLogger.log({
      type: "security",
      action: "javascript_error",
      details: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      },
    });
  });

  // Monitor for suspicious DOM modifications
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.tagName === "SCRIPT" &&
                !element.hasAttribute("nonce")
              ) {
                auditLogger.log({
                  type: "security",
                  action: "suspicious_script_injection",
                  details: {
                    outerHTML: element.outerHTML.substring(0, 200),
                  },
                });
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

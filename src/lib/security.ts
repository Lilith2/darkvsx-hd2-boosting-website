// Security utilities for input validation, sanitization, and protection
import DOMPurify from "dompurify";

export const security = {
  // Input validation
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  validatePassword: (
    password: string,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return { isValid: errors.length === 0, errors };
  },

  validateDiscordTag: (tag: string): boolean => {
    // Discord username format: username or username#discriminator
    const discordRegex = /^[a-zA-Z0-9._]{2,32}(#[0-9]{4})?$/;
    return discordRegex.test(tag);
  },

  // Input sanitization
  sanitizeInput: (input: string): string => {
    if (typeof input !== "string") return "";

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\0\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length to prevent DoS
    sanitized = sanitized.substring(0, 10000);

    return sanitized;
  },

  sanitizeHtml: (html: string): string => {
    if (typeof window === "undefined") {
      // Server-side: use a more restrictive approach
      return html.replace(/<[^>]*>/g, "");
    }

    // Client-side: use DOMPurify
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
      ALLOWED_ATTR: ["href", "target"],
      ALLOW_DATA_ATTR: false,
    });
  },

  // Rate limiting helpers
  createRateLimit: (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing requests for this identifier
      const userRequests = requests.get(identifier) || [];

      // Remove old requests outside the window
      const validRequests = userRequests.filter((time) => time > windowStart);

      // Check if limit exceeded
      if (validRequests.length >= maxRequests) {
        return false;
      }

      // Add current request
      validRequests.push(now);
      requests.set(identifier, validRequests);

      return true;
    };
  },

  // CSRF protection
  generateCSRFToken: (): string => {
    const array = new Uint8Array(32);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for older browsers
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  },

  validateCSRFToken: (token: string, expectedToken: string): boolean => {
    if (!token || !expectedToken) return false;
    return token === expectedToken;
  },

  // Content security
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  validateFileSize: (file: File, maxSizeBytes: number): boolean => {
    return file.size <= maxSizeBytes;
  },

  // URL validation
  validateURL: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:" || urlObj.protocol === "http:";
    } catch {
      return false;
    }
  },

  // Secure local storage helpers
  secureLocalStorage: {
    set: (key: string, value: any, expirationHours: number = 24): void => {
      if (typeof window === "undefined") return;

      const item = {
        value,
        expiry: Date.now() + expirationHours * 60 * 60 * 1000,
        checksum: btoa(JSON.stringify(value)), // Simple integrity check
      };

      try {
        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.warn("Secure localStorage set failed:", error);
      }
    },

    get: (key: string): any => {
      if (typeof window === "undefined") return null;

      try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);

        // Check expiration
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(key);
          return null;
        }

        // Verify integrity
        const expectedChecksum = btoa(JSON.stringify(parsed.value));
        if (parsed.checksum !== expectedChecksum) {
          localStorage.removeItem(key);
          return null;
        }

        return parsed.value;
      } catch (error) {
        console.warn("Secure localStorage get failed:", error);
        return null;
      }
    },

    remove: (key: string): void => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(key);
    },
  },

  // Password strength checker
  getPasswordStrength: (
    password: string,
  ): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push("Use at least 8 characters");

    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Include lowercase letters");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Include uppercase letters");

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push("Include numbers");

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push("Include special characters");

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push("Avoid repeated characters");

    if (!/123|abc|qwe|password|admin/i.test(password)) score += 1;
    else feedback.push("Avoid common patterns");

    return { score: Math.min(score, 5), feedback };
  },

  // Environment variable validation
  validateEnvVars: (): boolean => {
    const requiredVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      console.error("Missing required environment variables:", missing);
      return false;
    }

    return true;
  },
};

// Initialize security measures
export const initializeSecurity = (): void => {
  if (typeof window === "undefined") return;

  // Disable right-click context menu in production
  if (process.env.NODE_ENV === "production") {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  // Disable F12 and other dev tools shortcuts in production
  if (process.env.NODE_ENV === "production") {
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Console warning in production
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "🚨 Security Warning: Please do not paste or execute any code in this console. This could lead to unauthorized access to your account.",
    );
  }
};

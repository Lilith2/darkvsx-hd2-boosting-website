import { useState, useEffect } from "react";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  strength?: number; // For password strength (0-100)
}

export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    customValidator: (value: string) => {
      if (!value) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Please enter a valid email address";
      }
      return null;
    },
  },

  password: {
    required: true,
    minLength: 8,
    customValidator: (value: string) => {
      if (!value) return "Password is required";
      if (value.length < 8) return "Password must be at least 8 characters";

      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      const criteriasMet = [
        hasUppercase,
        hasLowercase,
        hasNumbers,
        hasSpecialChar,
      ].filter(Boolean).length;

      if (criteriasMet < 2) {
        return "Password should contain at least 2 of: uppercase, lowercase, numbers, special characters";
      }

      return null;
    },
  },

  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
    customValidator: (value: string) => {
      if (!value) return "Username is required";
      if (value.length < 3) return "Username must be at least 3 characters";
      if (value.length > 20) return "Username must be less than 20 characters";
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return "Username can only contain letters, numbers, underscores, and dashes";
      }
      return null;
    },
  },

  confirmPassword: (originalPassword: string) => ({
    required: true,
    customValidator: (value: string) => {
      if (!value) return "Please confirm your password";
      if (value !== originalPassword) return "Passwords don't match";
      return null;
    },
  }),
};

export function validateField(
  value: string,
  rules: ValidationRule,
): ValidationResult {
  const errors: string[] = [];

  // Required validation
  if (rules.required && !value.trim()) {
    errors.push("This field is required");
    return { isValid: false, errors };
  }

  // Skip other validations if empty and not required
  if (!value.trim() && !rules.required) {
    return { isValid: true, errors: [] };
  }

  // Length validations
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Must be less than ${rules.maxLength} characters`);
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push("Invalid format");
  }

  // Custom validation
  if (rules.customValidator) {
    const customError = rules.customValidator(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // Length bonus
  strength += Math.min(password.length * 2, 25);

  // Character variety bonus
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;

  // Length bonus for very long passwords
  if (password.length >= 12) strength += 10;

  return Math.min(strength, 100);
}

export function getPasswordStrengthLabel(strength: number): string {
  if (strength < 30) return "Weak";
  if (strength < 60) return "Fair";
  if (strength < 80) return "Good";
  return "Strong";
}

export function getPasswordStrengthColor(strength: number): string {
  if (strength < 30) return "text-red-400";
  if (strength < 60) return "text-yellow-400";
  if (strength < 80) return "text-blue-400";
  return "text-green-400";
}

// Debounced validation hook
export function useValidation(
  value: string,
  rules: ValidationRule,
  delay: number = 500,
) {
  const [result, setResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
  });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setResult({ isValid: true, errors: [] });
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(() => {
      const validationResult = validateField(value, rules);
      setResult(validationResult);
      setIsValidating(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, rules, delay]);

  return { ...result, isValidating };
}

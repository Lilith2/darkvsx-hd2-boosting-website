import { ApiError } from './types';
import { ERROR_MESSAGES } from './constants';

// Error handling utilities
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'UNKNOWN_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const apiError = error as any;
    if (apiError.message) return apiError.message;
    if (apiError.error_description) return apiError.error_description;
    if (apiError.error) return apiError.error;
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
}

export function handleApiError(error: any): ApiError {
  if (error?.code === 'PGRST116') {
    return {
      message: 'Database table not found. Please contact support.',
      status: 404,
      code: 'TABLE_NOT_FOUND',
    };
  }

  if (error?.message?.includes('network')) {
    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      status: 0,
      code: 'NETWORK_ERROR',
    };
  }

  if (error?.status === 401) {
    return {
      message: ERROR_MESSAGES.AUTH_ERROR,
      status: 401,
      code: 'AUTH_ERROR',
    };
  }

  if (error?.status === 403) {
    return {
      message: ERROR_MESSAGES.PERMISSION_ERROR,
      status: 403,
      code: 'PERMISSION_ERROR',
    };
  }

  if (error?.status === 404) {
    return {
      message: ERROR_MESSAGES.NOT_FOUND,
      status: 404,
      code: 'NOT_FOUND',
    };
  }

  return {
    message: getErrorMessage(error),
    status: error?.status || 500,
    code: error?.code || 'UNKNOWN_ERROR',
  };
}

// Async error wrapper
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async operation failed:', error);
      const apiError = handleApiError(error);
      throw new AppError(apiError.message, apiError.status, apiError.code);
    }
  };
}

// Safe execution wrapper
export function safeExecute<T>(
  operation: () => T,
  fallbackValue: T,
  onError?: (error: unknown) => void
): T {
  try {
    return operation();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Safe execution failed:', error);
    }
    return fallbackValue;
  }
}

// Retry logic
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on certain errors
      if (error && typeof error === 'object') {
        const apiError = error as any;
        if (apiError.status === 401 || apiError.status === 403 || apiError.status === 404) {
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

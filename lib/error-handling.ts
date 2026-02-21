// Error handling utilities for consistent error handling across the app

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  originalError?: Error;
  context?: Record<string, any>;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
  fallbackMessage?: string;
}

// Default error messages
const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'User not found. Please check your credentials.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'firebase/not-initialized': 'Service is temporarily unavailable. Please try again.',
  default: 'An unexpected error occurred. Please try again.',
};

// Parse Firebase error codes
export function parseFirebaseError(error: any): AppError {
  const code = error?.code || 'unknown';
  const message = DEFAULT_ERROR_MESSAGES[code] || DEFAULT_ERROR_MESSAGES.default;
  
  return {
    message,
    code,
    severity: getErrorSeverity(code),
    originalError: error,
  };
}

// Determine error severity based on error code
function getErrorSeverity(code: string): ErrorSeverity {
  const criticalCodes = ['permission-denied', 'auth/user-disabled'];
  const highCodes = ['auth/wrong-password', 'auth/user-not-found'];
  const lowCodes = ['auth/cancelled-popup-request'];
  
  if (criticalCodes.includes(code)) return 'critical';
  if (highCodes.includes(code)) return 'high';
  if (lowCodes.includes(code)) return 'low';
  return 'medium';
}

// Main error handler
export function handleError(
  error: any, 
  context?: string,
  options: ErrorHandlerOptions = {}
): AppError {
  const {
    showToast = true,
    logToConsole = true,
    reportToService = process.env.NODE_ENV === 'production',
    fallbackMessage = DEFAULT_ERROR_MESSAGES.default,
  } = options;

  // Parse the error
  let appError: AppError;
  
  if (error?.code?.startsWith('auth/') || error?.code?.includes('firebase')) {
    appError = parseFirebaseError(error);
  } else if (error instanceof Error) {
    appError = {
      message: error.message || fallbackMessage,
      severity: 'medium',
      originalError: error,
    };
  } else if (typeof error === 'string') {
    appError = {
      message: error,
      severity: 'medium',
    };
  } else {
    appError = {
      message: fallbackMessage,
      severity: 'medium',
      originalError: error,
    };
  }

  // Add context
  if (context) {
    appError.context = { ...appError.context, operation: context };
  }

  // Log to console
  if (logToConsole) {
    console.error(`[Error] ${context || 'Unknown operation'}:`, {
      message: appError.message,
      code: appError.code,
      severity: appError.severity,
      originalError: appError.originalError,
      context: appError.context,
    });
  }

  // Report to error tracking service
  if (reportToService) {
    reportError(appError);
  }

  return appError;
}

// Report error to tracking service
async function reportError(error: AppError): Promise<void> {
  try {
    // Example: Send to Sentry or custom backend
    if (typeof window !== 'undefined') {
      // You can integrate with Sentry, LogRocket, etc.
      // Sentry.captureException(error.originalError, {
      //   extra: { context: error.context, severity: error.severity }
      // });
    }
  } catch {
    // Silently fail - don't let error reporting break the app
  }
}

// Async error wrapper with retry logic
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  options: ErrorHandlerOptions & { retries?: number; retryDelay?: number } = {}
): Promise<{ data: T | null; error: AppError | null }> {
  const { retries = 0, retryDelay = 1000, ...errorOptions } = options;
  
  let lastError: AppError | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (error) {
      lastError = handleError(error, context, errorOptions);
      
      // Don't retry on certain errors
      if (lastError.code === 'permission-denied') {
        break;
      }
      
      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  return { data: null, error: lastError };
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  if (!name || name.length < 3) {
    return { valid: false, error: 'Display name must be at least 3 characters' };
  }
  if (name.length > 20) {
    return { valid: false, error: 'Display name must be less than 20 characters' };
  }
  if (!/^[a-zA-Z0-9 _-]+$/.test(name)) {
    return { valid: false, error: 'Display name can only contain letters, numbers, spaces, underscores, and hyphens' };
  }
  return { valid: true };
}

export function validateScore(score: number, maxScore: number = 100_000_000): { valid: boolean; error?: string } {
  if (typeof score !== 'number' || isNaN(score)) {
    return { valid: false, error: 'Invalid score value' };
  }
  if (score < 0) {
    return { valid: false, error: 'Score cannot be negative' };
  }
  if (score > maxScore) {
    return { valid: false, error: `Score exceeds maximum allowed value (${maxScore})` };
  }
  return { valid: true };
}

// Safe localStorage wrapper
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  
  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

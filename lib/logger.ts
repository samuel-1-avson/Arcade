/**
 * Production Logger
 * Safe logging utility that only logs in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix ? `[${options.prefix}]` : '';
    // Only enable logging in development
    this.enabled = options.enabled ?? process.env.NODE_ENV !== 'production';
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.enabled) return;

    const formattedMessage = `${this.prefix} ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, ...args);
        break;
      case 'info':
        console.log(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }
}

/**
 * Create a logger instance with a specific prefix
 */
export function createLogger(prefix: string): Logger {
  return new Logger({ prefix });
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Log an error with additional context
 * Always logs errors, even in production
 */
export function logError(error: unknown, context?: string): void {
  const message = context ? `[Error] ${context}:` : '[Error]';
  
  if (error instanceof Error) {
    console.error(message, error.message, error.stack);
  } else {
    console.error(message, error);
  }
}

/**
 * Error Boundary Component
 * Catches and handles errors gracefully
 */

import { Modal, MODAL_SIZES } from './Modal.js';

export class ErrorBoundary {
    constructor(options = {}) {
        this.options = {
            container: document.body,
            fallbackMessage: 'Something went wrong.',
            showDetails: process.env.NODE_ENV === 'development',
            onError: null,
            ...options
        };
        
        this.caughtErrors = [];
        this.originalErrorHandler = null;
    }

    // Wrap an async function with error handling
    wrap(fn, context = '') {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleError(error, context);
                throw error; // Re-throw for caller to handle if needed
            }
        };
    }

    // Handle caught error
    handleError(error, context = '') {
        console.error(`[ErrorBoundary] ${context}:`, error);
        
        this.caughtErrors.push({
            error,
            context,
            timestamp: new Date().toISOString()
        });
        
        // Call custom handler
        if (this.options.onError) {
            this.options.onError(error, context);
        }
        
        // Show user-friendly error
        this.showErrorUI(error, context);
        
        // Report to analytics (if configured)
        this.reportError(error, context);
    }

    // Show error UI
    showErrorUI(error, context) {
        const message = this.options.showDetails 
            ? `${this.options.fallbackMessage}<br><small>${error.message}</small>`
            : this.options.fallbackMessage;
        
        // Use toast for non-critical errors, modal for critical
        if (error.critical) {
            this.showErrorModal(error, context);
        } else {
            this.showErrorToast(error.message);
        }
    }

    showErrorModal(error, context) {
        const modal = new Modal({
            title: 'Error',
            size: MODAL_SIZES.SM,
            content: `
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <p>${this.options.fallbackMessage}</p>
                    ${this.options.showDetails ? `
                        <details>
                            <summary>Error Details</summary>
                            <pre>${error.message}\n${error.stack || ''}</pre>
                        </details>
                    ` : ''}
                </div>
            `,
            footer: `
                <button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove()">
                    Dismiss
                </button>
            `
        });
        
        modal.open();
    }

    showErrorToast(message) {
        // Check if Toast is available
        if (window.ToastService) {
            window.ToastService.error(message);
        } else {
            // Simple fallback
            const toast = document.createElement('div');
            toast.className = 'toast toast-error';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('toast-exit');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }
    }

    reportError(error, context) {
        // Send to error tracking service (e.g., Sentry)
        if (window.Sentry) {
            window.Sentry.captureException(error, {
                extra: { context }
            });
        }
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.group('Error Report');
            console.log('Context:', context);
            console.log('Error:', error);
            console.log('Stack:', error.stack);
            console.groupEnd();
        }
    }

    // Global error handler
    install() {
        this.originalErrorHandler = window.onerror;
        
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleError(error || new Error(message), 'Global Error');
            return true; // Prevent default
        };
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
        });
        
        return this;
    }

    uninstall() {
        window.onerror = this.originalErrorHandler;
    }

    // Get error history
    getErrors() {
        return [...this.caughtErrors];
    }

    clearErrors() {
        this.caughtErrors = [];
    }
}

// Async helper with automatic error handling
export const safeAsync = async (promise, errorMessage = 'Operation failed') => {
    try {
        const result = await promise;
        return { success: true, data: result, error: null };
    } catch (error) {
        return { success: false, data: null, error };
    }
};

// Retry wrapper with exponential backoff
export const withRetry = async (fn, options = {}) => {
    const {
        maxRetries = 3,
        delay = 1000,
        backoff = 2,
        onRetry = null
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            const waitTime = delay * Math.pow(backoff, attempt);
            
            if (onRetry) {
                onRetry(error, attempt + 1, waitTime);
            }
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    throw lastError;
};

export default ErrorBoundary;

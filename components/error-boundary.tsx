'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorCount: 0,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    
    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      this.reportError(error, errorInfo);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasKeyChanged) {
        this.resetError();
      }
    }
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // You can implement error reporting here
      // Example: Send to your backend or error tracking service
      await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Silently fail - we don't want error reporting to break the app
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.resetError();
    if (typeof window !== 'undefined') {
      window.location.href = '/hub/';
    }
  };

  public render() {
    if (this.state.hasError) {
      // If error occurs too many times, show fatal error UI
      if (this.state.errorCount > 3) {
        return (
          <FatalErrorUI
            error={this.state.error}
            onReload={this.handleReload}
            onGoHome={this.handleGoHome}
          />
        );
      }

      return (
        this.props.fallback || (
          <ErrorFallback
            error={this.state.error}
            onReset={this.resetError}
            onReload={this.handleReload}
            onGoHome={this.handleGoHome}
          />
        )
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
interface ErrorFallbackProps {
  error?: Error;
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

function ErrorFallback({ error, onReset, onReload, onGoHome }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6" role="alert" aria-live="assertive">
      <div className="bg-elevated border border-danger/30 p-8 max-w-md w-full">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" aria-hidden="true" />
        
        <h2 className="font-display text-lg font-bold uppercase tracking-wider text-primary mb-2 text-center">
          Something Went Wrong
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6 text-center">
          We apologize for the inconvenience. You can try resetting the component or reloading the page.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors mx-auto"
              aria-expanded={showDetails}
            >
              <Bug className="w-3 h-3" />
              {showDetails ? 'Hide Details' : 'Show Error Details'}
            </button>
            
            {showDetails && (
              <pre className="mt-2 p-3 bg-surface text-xs text-danger/80 overflow-auto max-h-40 rounded">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onReset}
            variant="default"
            className="flex-1"
            aria-label="Try again"
          >
            Try Again
          </Button>
          
          <Button
            onClick={onReload}
            variant="secondary"
            className="flex-1"
            aria-label="Reload page"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload
          </Button>
        </div>

        <button
          onClick={onGoHome}
          className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          aria-label="Go to home page"
        >
          <Home className="w-4 h-4" />
          Go to Home Page
        </button>
      </div>
    </div>
  );
}

// Fatal Error UI (when errors keep occurring)
interface FatalErrorUIProps {
  error?: Error;
  onReload: () => void;
  onGoHome: () => void;
}

function FatalErrorUI({ error, onReload, onGoHome }: FatalErrorUIProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" role="alert" aria-live="assertive">
      <div className="bg-elevated border border-danger p-8 max-w-lg w-full text-center">
        <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-6" aria-hidden="true" />
        
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-4">
          Critical Error
        </h1>
        
        <p className="text-muted-foreground mb-2">
          The application has encountered multiple errors and cannot continue.
        </p>
        
        <p className="text-sm text-muted-foreground/70 mb-6">
          This might be a temporary issue. Please try reloading the page or contact support if the problem persists.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/30 text-left overflow-auto max-h-48">
            <code className="text-xs text-danger">{error.message}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onReload} className="flex-1" aria-label="Reload page">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </Button>
          
          <Button onClick={onGoHome} variant="secondary" className="flex-1" aria-label="Go to home page">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground/50">
          Error ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
        </p>
      </div>
    </div>
  );
}

// Import useState for the fallback components
import { useState } from 'react';

// Feature-specific error boundaries
export function GameErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="bg-elevated border border-danger/30 p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h2 className="font-display text-lg font-bold uppercase text-primary mb-2">
              Game Error
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              There was an error loading the game. Please try again.
            </p>
            <Link href="/hub/">
              <Button>Return to Hub</Button>
            </Link>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function HubErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to your error tracking service
        console.error('[HubErrorBoundary]', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

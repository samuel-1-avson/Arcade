'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="bg-elevated border border-danger/30 p-8 max-w-md w-full text-center">
              <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-primary mb-2">
                Something Went Wrong
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                We apologize for the inconvenience. Please try refreshing the page.
              </p>
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

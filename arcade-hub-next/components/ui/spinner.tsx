'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-current border-t-transparent',
        sizes[size],
        className
      )}
    />
  );
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Spinner size="lg" className="text-accent" />
      <p className="mt-4 font-display text-sm uppercase tracking-wider text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

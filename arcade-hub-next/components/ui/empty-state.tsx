'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-elevated border border-white/[0.06] p-12 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 bg-surface border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold uppercase tracking-wide text-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-elevated border border-white/[0.04]',
        className
      )}
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-elevated border border-white/[0.06] overflow-hidden">
      <Skeleton className="h-32" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="bg-elevated border border-white/[0.06] overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-8 lg:p-12 space-y-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-12 w-32" />
        </div>
        <Skeleton className="lg:w-[45%] min-h-[280px]" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

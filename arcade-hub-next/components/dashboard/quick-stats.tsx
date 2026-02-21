'use client';

import { Trophy, Zap } from 'lucide-react';

export function QuickStats() {
  return (
    <div className="flex gap-8 pb-6 border-b border-white/[0.05] animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-elevated border border-white/[0.08] flex items-center justify-center">
          <Trophy className="w-5 h-5 text-accent" />
        </div>
        <div>
          <span className="block font-mono text-xl font-bold text-primary">0</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Score</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-elevated border border-white/[0.08] flex items-center justify-center">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        <div>
          <span className="block font-mono text-xl font-bold text-primary">1</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Level</span>
        </div>
      </div>
    </div>
  );
}

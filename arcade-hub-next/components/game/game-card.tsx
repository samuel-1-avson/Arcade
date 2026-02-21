'use client';

import Link from 'next/link';
import { Game } from '@/types/game';
import { cn } from '@/lib/utils';
import { Trophy, Users } from 'lucide-react';
import { GameIcon } from '@/components/game-icon';

interface GameCardProps {
  game: Game;
  className?: string;
}

export function GameCard({ game, className }: GameCardProps) {
  return (
    <Link href={`/game/${game.id}/`}>
      <div
        className={cn(
          'group relative bg-elevated border border-white/[0.06] overflow-hidden cursor-pointer',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-1 hover:border-white/[0.12]',
          className
        )}
      >
        {/* Art area */}
        <div className="relative h-32 bg-surface flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative transition-transform duration-300 group-hover:scale-110">
            <GameIcon icon={game.icon} size={48} className="text-primary" />
          </div>
          
          {/* Difficulty badge */}
          <span className={cn(
            'absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
            'bg-black/70 border border-white/10',
            game.difficulty === 'easy' && 'text-success border-success/30',
            game.difficulty === 'medium' && 'text-warning border-warning/30',
            game.difficulty === 'hard' && 'text-danger border-danger/30',
          )}>
            {game.difficulty}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-primary truncate group-hover:text-accent transition-colors">
            {game.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {game.description}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="w-3 h-3 text-warning" />
              <span>{game.highScore ? game.highScore.toLocaleString() : '—'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            </div>
          </div>
        </div>

        {/* Play button (appears on hover) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-elevated to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-full py-2 bg-surface border border-white/[0.08] text-accent text-xs font-display uppercase tracking-wider hover:bg-accent-dim hover:border-accent-border transition-colors">
            Play Now
          </button>
        </div>
      </div>
    </Link>
  );
}

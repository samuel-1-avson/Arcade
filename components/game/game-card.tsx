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
  // Determine difficulty label and color
  const difficultyConfig = {
    easy: { label: 'Easy', colorClass: 'text-success border-success/30' },
    medium: { label: 'Medium', colorClass: 'text-warning border-warning/30' },
    hard: { label: 'Hard', colorClass: 'text-danger border-danger/30' },
  };
  
  const difficulty = difficultyConfig[game.difficulty];

  return (
    <Link 
      href={`/game/${game.id}/`}
      className="group block"
      aria-label={`Play ${game.name} - ${game.description}. Difficulty: ${difficulty.label}`}
    >
      <article
        className={cn(
          'relative bg-elevated border border-white/[0.06] overflow-hidden',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-1 hover:border-white/[0.12]',
          'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background',
          className
        )}
      >
        {/* Art area */}
        <div 
          className="relative h-32 bg-surface flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
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
            <GameIcon icon={game.icon} size={48} className="text-primary" aria-hidden="true" />
          </div>
          
          {/* Difficulty badge */}
          <span 
            className={cn(
              'absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
              'bg-black/70 border',
              difficulty.colorClass
            )}
            aria-label={`Difficulty: ${difficulty.label}`}
          >
            {difficulty.label}
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
          <div 
            className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]"
            aria-label="Game statistics"
          >
            <div 
              className="flex items-center gap-1 text-xs text-muted-foreground"
              aria-label={`High score: ${game.highScore?.toLocaleString() || 'None'}`}
            >
              <Trophy className="w-3 h-3 text-warning" aria-hidden="true" />
              <span>{game.highScore ? game.highScore.toLocaleString() : '—'}</span>
            </div>
            <div 
              className="flex items-center gap-1 text-xs text-muted-foreground"
              aria-label="Players online"
            >
              <Users className="w-3 h-3" aria-hidden="true" />
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
              <span className="sr-only">Active players indicator</span>
            </div>
          </div>
        </div>

        {/* Play button (appears on hover/focus) */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-elevated to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          aria-hidden="true"
        >
          <span className="block w-full py-2 bg-surface border border-white/[0.08] text-accent text-xs font-display uppercase tracking-wider text-center hover:bg-accent-dim hover:border-accent-border transition-colors">
            Play Now
          </span>
        </div>
      </article>
    </Link>
  );
}

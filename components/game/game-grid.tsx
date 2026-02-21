'use client';

import { useState } from 'react';
import { GameCard } from './game-card';
import { useGames } from '@/hooks/useGames';

export function GameGrid() {
  const { games, filter, setFilter } = useGames();

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-primary">
          All Games
        </h2>
        <div className="flex gap-1">
          {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setFilter(diff)}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                filter === diff
                  ? 'bg-elevated border border-accent-border text-accent'
                  : 'bg-transparent border border-transparent text-muted-foreground hover:text-primary'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game, idx) => (
          <div 
            key={game.id}
            style={{ animationDelay: `${idx * 50}ms` }}
            className="animate-fade-in"
          >
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
}

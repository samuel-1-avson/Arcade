'use client';

import { useState } from 'react';
import { GameCard } from '@/components/game/game-card';
import { useGames } from '@/hooks/useGames';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function GamesPage() {
  const { games, filter, setFilter, allGames } = useGames();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = searchQuery
    ? games.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : games;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Game Library
          </h1>
          <p className="text-muted-foreground text-sm">
            {allGames.length} games available
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
          <button
            key={diff}
            onClick={() => setFilter(diff)}
            className={cn(
              'px-4 py-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors',
              filter === diff
                ? 'bg-elevated border border-accent-border text-accent'
                : 'bg-transparent border border-transparent text-muted-foreground hover:text-primary'
            )}
          >
            {diff === 'all' ? 'All Games' : diff}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game, idx) => (
            <div 
              key={game.id}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="animate-fade-in"
            >
              <GameCard game={game} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-elevated border border-white/[0.06] p-12 text-center">
          <p className="text-muted-foreground">No games found matching your search.</p>
          <button 
            onClick={() => { setSearchQuery(''); setFilter('all'); }}
            className="text-accent hover:underline mt-2 text-sm"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

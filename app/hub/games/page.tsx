'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GameIcon } from '@/components/game-icon';
import { Trophy, Users } from 'lucide-react';
import type { Game } from '@/types/game';

// Hardcoded games
const GAMES: Game[] = [
  {
    id: 'neon-snake',
    name: 'Neon Snake Arena',
    description: 'A modern cyberpunk twist on the classic Snake game with neon aesthetics, power-ups, and multiple game modes.',
    icon: 'Gamepad2',
    difficulty: 'easy',
    category: 'Arcade',
    path: '/games/neon-snake/index.html',
  },
];

export default function GamesPage() {
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter games
  const filteredGames = searchQuery
    ? GAMES.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filter === 'all'
    ? GAMES
    : GAMES.filter(g => g.difficulty === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Game Library
          </h1>
          <p className="text-muted-foreground text-sm">
            {GAMES.length} games available
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
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="bg-elevated border border-white/[0.06] p-12 text-center">
          <p className="text-muted-foreground">No games found.</p>
        </div>
      )}
    </div>
  );
}

// Game Card Component
function GameCard({ game }: { game: Game }) {
  const difficultyConfig = {
    easy: { label: 'Easy', colorClass: 'text-green-400 border-green-400/30' },
    medium: { label: 'Medium', colorClass: 'text-yellow-400 border-yellow-400/30' },
    hard: { label: 'Hard', colorClass: 'text-red-400 border-red-400/30' },
  };
  
  const difficulty = difficultyConfig[game.difficulty];

  return (
    <Link 
      href={`/game/${game.id}/`}
      className="group block"
    >
      <article className="relative bg-[#121212] border border-white/[0.06] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/[0.12]">
        {/* Art area */}
        <div className="relative h-32 bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
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
            <GameIcon icon={game.icon} size={48} className="text-[#00e5ff]" />
          </div>
          
          {/* Difficulty badge */}
          <span className={cn(
            'absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
            'bg-black/70 border',
            difficulty.colorClass
          )}>
            {difficulty.label}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[#00e5ff] truncate group-hover:text-[#00b8cc] transition-colors">
            {game.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mt-1">
            {game.description}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span>—</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Play button (appears on hover) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="block w-full py-2 bg-[#0a0a0a] border border-white/[0.08] text-[#00e5ff] text-xs font-display uppercase tracking-wider text-center hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]/30 transition-colors">
            Play Now
          </span>
        </div>
      </article>
    </Link>
  );
}

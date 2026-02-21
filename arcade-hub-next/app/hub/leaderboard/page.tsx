'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { useLeaderboardStore } from '@/lib/store';
import { useGames } from '@/hooks/useGames';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const { entries, isLoading, selectedGame, setSelectedGame, fetchLeaderboard } = useLeaderboardStore();
  const { allGames } = useGames();
  
  useEffect(() => {
    fetchLeaderboard(selectedGame);
  }, [selectedGame, fetchLeaderboard]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Medal className={cn('w-5 h-5', getRankStyle(rank))} />;
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Leaderboards
          </h1>
          <p className="text-muted-foreground text-sm">
            Compete with players worldwide
          </p>
        </div>
      </div>

      {/* Game Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedGame('global')}
          className={cn(
            'px-4 py-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors',
            selectedGame === 'global'
              ? 'bg-elevated border border-accent-border text-accent'
              : 'bg-transparent border border-transparent text-muted-foreground hover:text-primary'
          )}
        >
          Global
        </button>
        {allGames.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={cn(
              'px-4 py-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors',
              selectedGame === game.id
                ? 'bg-elevated border border-accent-border text-accent'
                : 'bg-transparent border border-transparent text-muted-foreground hover:text-primary'
            )}
          >
            {game.name}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-elevated border border-white/[0.06]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/[0.05] text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1">Rank</div>
          <div className="col-span-7">Player</div>
          <div className="col-span-4 text-right">Score</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading leaderboard...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No scores yet. Be the first to play!
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {entries.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  'grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/[0.02] transition-colors',
                  entry.rank <= 3 && 'bg-white/[0.02]'
                )}
              >
                <div className={cn('col-span-1 font-mono font-bold text-lg', getRankStyle(entry.rank))}>
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <span>{entry.rank}</span>
                  </div>
                </div>
                <div className="col-span-7 flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface border border-white/[0.08] flex items-center justify-center text-lg">
                    {entry.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-primary">{entry.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="col-span-4 text-right">
                  <span className="font-mono font-bold text-accent text-lg">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Rank Card */}
      <div className="bg-elevated border border-accent-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Trophy className="w-8 h-8 text-accent" />
          <div>
            <p className="text-sm text-muted-foreground">Your Rank</p>
            <p className="font-display text-xl font-bold text-primary">Not Ranked</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Play games to climb the leaderboard!
        </p>
      </div>
    </div>
  );
}

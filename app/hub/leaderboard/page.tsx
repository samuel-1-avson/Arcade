'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, User, ChevronDown, AlertCircle } from 'lucide-react';
import { useLeaderboardStore } from '@/lib/store';
import { useGames } from '@/hooks/useGames';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAnnouncer } from '@/lib/a11y';

export default function LeaderboardPage() {
  const { 
    entries, 
    isLoading, 
    isLoadingMore,
    selectedGame, 
    currentUserRank,
    hasMore,
    error,
    setSelectedGame, 
    fetchLeaderboard,
    loadMore,
    refreshLeaderboard,
    clearError,
  } = useLeaderboardStore();
  
  const { allGames } = useGames();
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch leaderboard when game changes
  useEffect(() => {
    fetchLeaderboard(selectedGame, user?.id);
  }, [selectedGame, fetchLeaderboard, user?.id]);

  // Announce changes to screen readers
  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      announce(`Leaderboard loaded with ${entries.length} entries`);
    }
  }, [entries.length, isLoading, announce]);

  const handleTabChange = useCallback((gameId: string, index: number) => {
    setSelectedGame(gameId);
    setActiveTab(index);
    clearError();
  }, [setSelectedGame, clearError]);

  const handleLoadMore = useCallback(async () => {
    await loadMore(selectedGame);
    announce(`Loaded more entries. Total: ${entries.length + 50} entries`);
  }, [loadMore, selectedGame, entries.length, announce]);

  const handleRefresh = useCallback(() => {
    refreshLeaderboard(selectedGame, user?.id);
    announce('Refreshing leaderboard');
  }, [refreshLeaderboard, selectedGame, user?.id, announce]);

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
      return <Medal className={cn('w-5 h-5', getRankStyle(rank))} aria-hidden="true" />;
    }
    return null;
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return '1st place';
    if (rank === 2) return '2nd place';
    if (rank === 3) return '3rd place';
    return `${rank}th place`;
  };

  return (
    <main className="space-y-6 animate-fade-in" role="main" aria-label="Leaderboards">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Leaderboards
          </h1>
          <p className="text-muted-foreground text-sm">
            Compete with players worldwide
          </p>
        </div>
        
        {/* Refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label="Refresh leaderboard"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </header>

      {/* Error Message */}
      {error && (
        <div 
          className="p-4 bg-danger/10 border border-danger/30 rounded flex items-center gap-3"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-danger flex-1">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Game Tabs */}
      <nav 
        className="flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Select game leaderboard"
      >
        <button
          onClick={() => handleTabChange('global', 0)}
          role="tab"
          aria-selected={selectedGame === 'global'}
          aria-controls="leaderboard-panel"
          tabIndex={selectedGame === 'global' ? 0 : -1}
          className={cn(
            'px-4 py-2 text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors',
            selectedGame === 'global'
              ? 'bg-elevated border border-accent-border text-accent'
              : 'bg-transparent border border-transparent text-muted-foreground hover:text-primary'
          )}
        >
          Global
        </button>
        {allGames.map((game, index) => (
          <button
            key={game.id}
            onClick={() => handleTabChange(game.id, index + 1)}
            role="tab"
            aria-selected={selectedGame === game.id}
            aria-controls="leaderboard-panel"
            tabIndex={selectedGame === game.id ? 0 : -1}
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
      </nav>

      {/* Leaderboard Table */}
      <section 
        id="leaderboard-panel"
        role="tabpanel"
        aria-label={`${selectedGame === 'global' ? 'Global' : selectedGame} leaderboard`}
        className="bg-elevated border border-white/[0.06]"
      >
        {/* Table Header */}
        <div 
          className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/[0.05] text-xs font-medium uppercase tracking-wider text-muted-foreground"
          role="row"
        >
          <div className="col-span-2 sm:col-span-1" role="columnheader">Rank</div>
          <div className="col-span-6 sm:col-span-7" role="columnheader">Player</div>
          <div className="col-span-4 text-right" role="columnheader">Score</div>
        </div>

        {/* Table Body */}
        {isLoading && entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" role="status" aria-live="polite">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
            Loading leaderboard...
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground" role="status">
            No scores yet. Be the first to play!
          </div>
        ) : (
          <>
            <div 
              className="divide-y divide-white/[0.03]"
              role="list"
              aria-label="Leaderboard entries"
            >
              {entries.map((entry) => (
                <article
                  key={`${entry.userId}-${entry.rank}`}
                  className={cn(
                    'grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/[0.02] transition-colors',
                    entry.rank <= 3 && 'bg-white/[0.02]',
                    entry.userId === user?.id && 'border-l-2 border-accent'
                  )}
                  role="listitem"
                  aria-label={`${getRankLabel(entry.rank)}: ${entry.displayName} with ${entry.score.toLocaleString()} points`}
                >
                  <div className={cn('col-span-2 sm:col-span-1 font-mono font-bold text-lg', getRankStyle(entry.rank))}>
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <span aria-label={getRankLabel(entry.rank)}>{entry.rank}</span>
                    </div>
                  </div>
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface border border-white/[0.08] flex items-center justify-center overflow-hidden">
                      {entry.photoURL ? (
                        <img 
                          src={entry.photoURL} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {entry.displayName}
                        {entry.userId === user?.id && (
                          <span className="ml-2 text-xs text-accent">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.timestamp?.toLocaleDateString?.() || 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="font-mono font-bold text-accent text-lg">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 border-t border-white/[0.05] text-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  variant="secondary"
                  className="w-full sm:w-auto"
                  aria-label="Load more leaderboard entries"
                >
                  {isLoadingMore ? (
                    'Loading...'
                  ) : (
                    <>
                      Load More <ChevronDown className="w-4 h-4 ml-2" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Your Rank Card */}
      <aside 
        className="bg-elevated border border-accent-border p-4 flex items-center justify-between"
        aria-label="Your ranking"
      >
        <div className="flex items-center gap-4">
          <Trophy className="w-8 h-8 text-accent" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">Your Rank</p>
            {user ? (
              <p className="font-display text-xl font-bold text-primary">
                {currentUserRank ? `#${currentUserRank}` : 'Not Ranked'}
              </p>
            ) : (
              <p className="font-display text-xl font-bold text-primary">Sign in to rank</p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">
          {user 
            ? currentUserRank 
              ? 'Keep playing to climb higher!' 
              : 'Play games to climb the leaderboard!'
            : 'Sign in to track your progress'}
        </p>
      </aside>
    </main>
  );
}

'use client';

import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import { Game } from '@/types/game';

const GAMES: Game[] = [
  // Games will be added here
];

export function useGames() {
  const { games, filter, highScores, setGames, setFilter } = useGameStore();

  useEffect(() => {
    // Initialize games with high scores
    const gamesWithScores = GAMES.map(game => ({
      ...game,
      highScore: highScores[game.id] || 0,
    }));
    setGames(gamesWithScores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredGames = useMemo(() => {
    if (filter === 'all') return games;
    return games.filter((g) => g.difficulty === filter);
  }, [games, filter]);



  return {
    games: filteredGames,
    allGames: games,
    filter,
    setFilter,
  };
}

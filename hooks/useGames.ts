'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Game } from '@/types/game';

// Hardcoded games list - this is the source of truth
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

export function useGames() {
  const { games: storedGames, filter, highScores, setGames, setFilter } = useGameStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize games on mount
  useEffect(() => {
    if (!isInitialized) {
      // Merge games with high scores
      const gamesWithScores = GAMES.map(game => ({
        ...game,
        highScore: highScores[game.id] || 0,
      }));
      
      console.log('[useGames] Initializing games:', gamesWithScores);
      setGames(gamesWithScores);
      setIsInitialized(true);
    }
  }, [isInitialized, highScores, setGames]);

  // Update high scores when they change
  useEffect(() => {
    if (isInitialized && Object.keys(highScores).length > 0) {
      const gamesWithScores = GAMES.map(game => ({
        ...game,
        highScore: highScores[game.id] || 0,
      }));
      setGames(gamesWithScores);
    }
  }, [highScores, isInitialized, setGames]);

  // Use stored games if available, otherwise fall back to GAMES
  const gamesList = storedGames.length > 0 ? storedGames : GAMES;

  const filteredGames = useMemo(() => {
    if (filter === 'all') return gamesList;
    return gamesList.filter((g) => g.difficulty === filter);
  }, [gamesList, filter]);

  return {
    games: filteredGames,
    allGames: gamesList,
    filter,
    setFilter,
  };
}

'use client';

import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import { Game } from '@/types/game';

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
  const { games, filter, highScores, setGames, setFilter } = useGameStore();

  useEffect(() => {
    // Initialize games with high scores
    const gamesWithScores = GAMES.map(game => ({
      ...game,
      highScore: highScores[game.id] || 0,
    }));
    setGames(gamesWithScores);
  }, [highScores, setGames]);

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

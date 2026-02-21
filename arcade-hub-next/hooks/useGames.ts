'use client';

import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/lib/store';
import { Game } from '@/types/game';

const GAMES: Game[] = [
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat food, grow longer, avoid walls',
    icon: 'Gamepad2',
    difficulty: 'easy',
    category: 'classic',
    path: '/games/snake/',
  },
  {
    id: 'pacman',
    name: 'Pac-Man',
    description: 'Navigate mazes, eat dots, avoid ghosts',
    icon: 'Ghost',
    difficulty: 'medium',
    category: 'arcade',
    path: '/games/pacman/',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack blocks to clear lines',
    icon: 'Grid3x3',
    difficulty: 'medium',
    category: 'puzzle',
    path: '/games/tetris/',
  },
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'Smash bricks with a ball',
    icon: 'Square',
    difficulty: 'easy',
    category: 'arcade',
    path: '/games/breakout/',
  },
  {
    id: 'asteroids',
    name: 'Asteroids',
    description: 'Blast asteroids in space',
    icon: 'Sparkles',
    difficulty: 'hard',
    category: 'shooter',
    path: '/games/asteroids/',
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    description: 'Clear the minefield',
    icon: 'Bomb',
    difficulty: 'hard',
    category: 'puzzle',
    path: '/games/minesweeper/',
  },
  {
    id: '2048',
    name: '2048',
    description: 'Merge tiles to reach 2048',
    icon: 'Calculator',
    difficulty: 'medium',
    category: 'puzzle',
    path: '/games/2048/',
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    description: 'Classic X and O game',
    icon: 'Circle',
    difficulty: 'easy',
    category: 'strategy',
    path: '/games/tictactoe/',
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

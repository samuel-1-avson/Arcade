import { create } from 'zustand';
import { Game } from '@/types/game';

interface GameState {
  games: Game[];
  filter: 'all' | 'easy' | 'medium' | 'hard';
  highScores: Record<string, number>;
  
  // Actions
  setGames: (games: Game[]) => void;
  setFilter: (filter: GameState['filter']) => void;
  setHighScore: (gameId: string, score: number) => void;
}

export const useGameStore = create<GameState>()((set) => ({
  games: [],
  filter: 'all',
  highScores: {},
  
  setGames: (games) => set({ games }),
  
  setFilter: (filter) => set({ filter }),
  
  setHighScore: (gameId, score) => set((state) => ({
    highScores: {
      ...state.highScores,
      [gameId]: Math.max(state.highScores[gameId] || 0, score),
    },
  })),
}));

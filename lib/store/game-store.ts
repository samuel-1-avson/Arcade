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

export const useGameStore = create<GameState>()((set, get) => ({
  games: [],
  filter: 'all',
  highScores: {},
  
  setGames: (games) => {
    console.log('[GameStore] Setting games:', games);
    set({ games });
  },
  
  setFilter: (filter) => set({ filter }),
  
  setHighScore: (gameId, score) => {
    const currentHigh = get().highScores[gameId] || 0;
    if (score > currentHigh) {
      set((state) => ({
        highScores: {
          ...state.highScores,
          [gameId]: score,
        },
      }));
    }
  },
}));

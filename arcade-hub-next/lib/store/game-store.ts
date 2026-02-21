import { create } from 'zustand';
import { Game, GameScore } from '@/types/game';

interface GameState {
  games: Game[];
  selectedGame: Game | null;
  filter: 'all' | 'easy' | 'medium' | 'hard';
  isPlaying: boolean;
  highScores: Record<string, number>;
  
  // Actions
  setGames: (games: Game[]) => void;
  selectGame: (game: Game | null) => void;
  setFilter: (filter: GameState['filter']) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setHighScore: (gameId: string, score: number) => void;
  
  // Computed
  getFilteredGames: () => Game[];
  getGameById: (id: string) => Game | undefined;
}

export const useGameStore = create<GameState>()((set, get) => ({
  games: [],
  selectedGame: null,
  filter: 'all',
  isPlaying: false,
  highScores: {},
  
  setGames: (games) => set({ games }),
  
  selectGame: (game) => set({ selectedGame: game }),
  
  setFilter: (filter) => set({ filter }),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  setHighScore: (gameId, score) => set((state) => ({
    highScores: {
      ...state.highScores,
      [gameId]: Math.max(state.highScores[gameId] || 0, score),
    },
  })),
  
  getFilteredGames: () => {
    const { games, filter } = get();
    if (filter === 'all') return games;
    return games.filter((g) => g.difficulty === filter);
  },
  
  getGameById: (id) => {
    return get().games.find((g) => g.id === id);
  },
}));

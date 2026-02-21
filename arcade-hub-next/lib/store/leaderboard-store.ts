import { create } from 'zustand';
import { LeaderboardEntry } from '@/types/game';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  selectedGame: string;
  isLoading: boolean;
  
  // Actions
  setEntries: (entries: LeaderboardEntry[]) => void;
  setCurrentUserRank: (rank: number | null) => void;
  setSelectedGame: (gameId: string) => void;
  setIsLoading: (loading: boolean) => void;
  fetchLeaderboard: (gameId: string) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>()((set) => ({
  entries: [],
  currentUserRank: null,
  selectedGame: 'global',
  isLoading: false,
  
  setEntries: (entries) => set({ entries }),
  setCurrentUserRank: (rank) => set({ currentUserRank: rank }),
  setSelectedGame: (gameId) => set({ selectedGame: gameId }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  fetchLeaderboard: async (gameId) => {
    set({ isLoading: true });
    
    // Mock data - will be replaced with Firebase
    const mockEntries: LeaderboardEntry[] = [
      { rank: 1, userId: '1', displayName: 'ArcadeKing', avatar: '👑', score: 999999, timestamp: new Date() },
      { rank: 2, userId: '2', displayName: 'PixelPro', avatar: '🎮', score: 875000, timestamp: new Date() },
      { rank: 3, userId: '3', displayName: 'RetroFan', avatar: '🕹️', score: 750000, timestamp: new Date() },
    ];
    
    set({ entries: mockEntries, isLoading: false });
  },
}));

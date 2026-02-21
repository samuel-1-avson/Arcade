import { create } from 'zustand';
import { LeaderboardEntry } from '@/types/game';
import { leaderboardService } from '@/lib/firebase/services/leaderboard';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  selectedGame: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setEntries: (entries: LeaderboardEntry[]) => void;
  setCurrentUserRank: (rank: number | null) => void;
  setSelectedGame: (gameId: string) => void;
  setIsLoading: (loading: boolean) => void;
  fetchLeaderboard: (gameId: string, userId?: string) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>()((set) => ({
  entries: [],
  currentUserRank: null,
  selectedGame: 'global',
  isLoading: false,
  error: null,
  
  setEntries: (entries) => set({ entries }),
  setCurrentUserRank: (rank) => set({ currentUserRank: rank }),
  setSelectedGame: (gameId) => set({ selectedGame: gameId }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  fetchLeaderboard: async (gameId: string, userId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      let entries: LeaderboardEntry[];
      
      entries = await leaderboardService.getLeaderboard(gameId, 50);
      
      set({ entries, isLoading: false });
      
      // Fetch user's rank if userId provided
      if (userId) {
        const rank = await leaderboardService.getUserRank(userId, gameId);
        set({ currentUserRank: rank });
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      set({ 
        error: 'Failed to load leaderboard', 
        isLoading: false,
        entries: [] 
      });
    }
  },
}));

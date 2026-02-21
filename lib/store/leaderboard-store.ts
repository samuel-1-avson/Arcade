import { create } from 'zustand';
import { LeaderboardEntry } from '@/types/game';
import { leaderboardService, LeaderboardResult } from '@/lib/firebase/services/leaderboard';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  selectedGame: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  
  // Actions
  setEntries: (entries: LeaderboardEntry[]) => void;
  setCurrentUserRank: (rank: number | null) => void;
  setSelectedGame: (gameId: string) => void;
  setIsLoading: (loading: boolean) => void;
  fetchLeaderboard: (gameId: string, userId?: string) => Promise<void>;
  loadMore: (gameId: string) => Promise<void>;
  refreshLeaderboard: (gameId: string, userId?: string) => Promise<void>;
  clearError: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>()((set, get) => ({
  entries: [],
  currentUserRank: null,
  selectedGame: 'global',
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  lastDoc: null,
  
  setEntries: (entries) => set({ entries }),
  setCurrentUserRank: (rank) => set({ currentUserRank: rank }),
  setSelectedGame: (gameId) => set({ selectedGame: gameId, entries: [], lastDoc: null, hasMore: true }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  clearError: () => set({ error: null }),
  
  fetchLeaderboard: async (gameId: string, userId?: string) => {
    // Prevent duplicate requests
    if (get().isLoading) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const result = await leaderboardService.getLeaderboard(gameId, 50);
      
      set({ 
        entries: result.entries, 
        isLoading: false,
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
      });
      
      // Fetch user's rank if userId provided (non-blocking)
      if (userId) {
        leaderboardService.getUserRank(userId, gameId)
          .then(rank => set({ currentUserRank: rank }))
          .catch(() => set({ currentUserRank: null }));
      }
    } catch (error) {
      console.error('[LeaderboardStore] fetchLeaderboard error:', error);
      set({ 
        error: 'Failed to load leaderboard. Please try again.', 
        isLoading: false,
        entries: [],
        hasMore: false,
      });
    }
  },
  
  loadMore: async (gameId: string) => {
    const { lastDoc, hasMore, isLoadingMore, entries } = get();
    
    // Don't load if already loading, no more results, or no last doc
    if (isLoadingMore || !hasMore || !lastDoc) return;
    
    set({ isLoadingMore: true });
    
    try {
      const result = await leaderboardService.getLeaderboard(gameId, 50, lastDoc);
      
      // Append new entries to existing ones
      set({ 
        entries: [...entries, ...result.entries], 
        isLoadingMore: false,
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
      });
    } catch (error) {
      console.error('[LeaderboardStore] loadMore error:', error);
      set({ 
        error: 'Failed to load more entries. Please try again.', 
        isLoadingMore: false,
      });
    }
  },
  
  refreshLeaderboard: async (gameId: string, userId?: string) => {
    // Clear cache and fetch fresh data
    leaderboardService.clearCache();
    set({ lastDoc: null, hasMore: true, entries: [] });
    await get().fetchLeaderboard(gameId, userId);
  },
}));

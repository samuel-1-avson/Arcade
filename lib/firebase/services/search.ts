import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAt,
  endAt,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

export interface SearchResult {
  id: string;
  type: 'user' | 'game';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  type?: 'user' | 'game' | 'all';
  limit?: number;
}

// Cache for search results
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const SEARCH_CACHE_DURATION = 30 * 1000; // 30 seconds

// Helper to get cache key
function getCacheKey(query: string, filters: SearchFilters): string {
  return `${query}_${filters.type || 'all'}_${filters.limit || 20}`;
}

// Helper to check if cache is valid
function isCacheValid(cacheEntry: { timestamp: number } | undefined): boolean {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < SEARCH_CACHE_DURATION;
}

export const searchService = {
  // Search users by display name
  searchUsers: async (searchTerm: string, currentUserId: string, maxResults: number = 20): Promise<SearchResult[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) {
        console.error('[Search] Firebase not initialized');
        return [];
      }

      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const normalizedTerm = searchTerm.toLowerCase().trim();
      
      // Query users collection
      const usersRef = collection(db, 'users');
      
      // Note: This is a simple prefix search. For production, consider Algolia or Elasticsearch
      // Firestore doesn't support native full-text search
      const q = query(
        usersRef,
        where('displayNameLower', '>=', normalizedTerm),
        where('displayNameLower', '<=', normalizedTerm + '\uf8ff'),
        limit(maxResults)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs
        .filter(doc => doc.id !== currentUserId) // Exclude current user
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'user' as const,
            title: data.displayName || 'Anonymous',
            subtitle: `Level ${data.level || 1}`,
            imageUrl: data.photoURL,
            metadata: {
              level: data.level || 1,
              totalScore: data.totalScore || 0,
            },
          };
        });
    } catch (error) {
      console.error('[Search] searchUsers error:', error);
      return [];
    }
  },

  // Search games
  searchGames: async (searchTerm: string, maxResults: number = 10): Promise<SearchResult[]> => {
    // NOTE: Game search is not implemented yet
    // Games should be stored in Firestore for proper server-side search
    // For now, return empty array - users can browse games from the hub
    return [];
  },

  // Universal search
  search: async (
    searchTerm: string, 
    currentUserId: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> => {
    const cacheKey = getCacheKey(searchTerm, filters);
    const cached = searchCache.get(cacheKey);
    
    if (isCacheValid(cached)) {
      console.log('[Search] Returning cached results');
      return cached!.results;
    }

    const results: SearchResult[] = [];
    const searchLimit = filters.limit || 20;

    try {
      // Search users
      if (!filters.type || filters.type === 'user' || filters.type === 'all') {
        const users = await searchService.searchUsers(searchTerm, currentUserId, searchLimit);
        results.push(...users);
      }

      // Search games
      if (!filters.type || filters.type === 'game' || filters.type === 'all') {
        const games = await searchService.searchGames(searchTerm, Math.floor(searchLimit / 2));
        results.push(...games);
      }

      // Cache results
      searchCache.set(cacheKey, {
        results,
        timestamp: Date.now(),
      });

      return results;
    } catch (error) {
      console.error('[Search] search error:', error);
      return [];
    }
  },

  // Get recent searches from localStorage
  getRecentSearches: (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('recentSearches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Add to recent searches
  addRecentSearch: (term: string): void => {
    if (typeof window === 'undefined' || !term.trim()) return;
    try {
      const recent = searchService.getRecentSearches();
      const updated = [term, ...recent.filter(t => t !== term)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  },

  // Clear recent searches
  clearRecentSearches: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('recentSearches');
    } catch {
      // Ignore localStorage errors
    }
  },

  // Clear search cache
  clearCache: (): void => {
    searchCache.clear();
  },

  // Get user profile by ID (for search results)
  getUserProfile: async (userId: string): Promise<SearchResult | null> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return null;

      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) return null;

      const data = userDoc.data();
      return {
        id: userId,
        type: 'user',
        title: data.displayName || 'Anonymous',
        subtitle: `Level ${data.level || 1}`,
        imageUrl: data.photoURL,
        metadata: {
          level: data.level || 1,
          totalScore: data.totalScore || 0,
        },
      };
    } catch (error) {
      console.error('[Search] getUserProfile error:', error);
      return null;
    }
  },
};

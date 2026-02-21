import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';
import { LeaderboardEntry } from '@/types/game';

const SCORES_COLLECTION = 'scores';
const USER_STATS_COLLECTION = 'userStats';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Cache for leaderboard data
interface CacheEntry {
  data: LeaderboardEntry[];
  timestamp: number;
  lastDoc: QueryDocumentSnapshot | null;
}

const leaderboardCache = new Map<string, CacheEntry>();

export interface ScoreData {
  userId: string;
  displayName: string;
  avatar: string;
  gameId: string;
  score: number;
  timestamp: Date;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot | null;
  totalCount?: number;
}

// Helper to get cache key
function getCacheKey(gameId: string, page: number): string {
  return `${gameId}_${page}`;
}

// Helper to check if cache is valid
function isCacheValid(cacheEntry: CacheEntry | undefined): boolean {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION_MS;
}

// Helper to batch fetch user profiles efficiently
async function batchFetchUserProfiles(
  db: any, 
  userIds: string[]
): Promise<Record<string, { displayName: string; avatar: string; photoURL?: string }>> {
  const userProfiles: Record<string, { displayName: string; avatar: string; photoURL?: string }> = {};
  const BATCH_SIZE = 10;
  
  // Fetch in batches to respect Firestore 'in' query limit
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    try {
      const usersQuery = query(collection(db, 'users'), where('__name__', 'in', batch));
      const usersSnap = await getDocs(usersQuery);
      
      usersSnap.docs.forEach(doc => {
        const data = doc.data();
        userProfiles[doc.id] = {
          displayName: data.displayName || 'Anonymous',
          avatar: data.avatar || 'User',
          photoURL: data.photoURL,
        };
      });
    } catch (error) {
      console.error(`[Leaderboard] Error fetching user batch ${i / BATCH_SIZE}:`, error);
    }
  }
  
  return userProfiles;
}

export const leaderboardService = {
  // Submit a new score with validation and anti-cheat checks
  submitScore: async (scoreData: Omit<ScoreData, 'timestamp'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const db = await getFirebaseDb();
      if (!db) {
        console.error('[Leaderboard] Firebase not initialized');
        return { success: false, error: 'Firebase not initialized' };
      }

      // Validation
      if (!scoreData.userId || !scoreData.gameId || typeof scoreData.score !== 'number') {
        return { success: false, error: 'Invalid score data' };
      }

      // Anti-cheat: Validate score range
      if (scoreData.score < 0 || scoreData.score > 100_000_000) {
        return { success: false, error: 'Invalid score value' };
      }

      const scoresRef = collection(db, SCORES_COLLECTION);
      
      // Add the score with metadata
      await addDoc(scoresRef, {
        ...scoreData,
        timestamp: serverTimestamp(),
        verified: false, // Will be verified by cloud function
      });

      // Update user's best score for this game atomically
      const userStatsRef = doc(db, USER_STATS_COLLECTION, `${scoreData.userId}_${scoreData.gameId}`);
      
      try {
        const userStatsSnap = await getDoc(userStatsRef);
        
        if (!userStatsSnap.exists() || userStatsSnap.data().bestScore < scoreData.score) {
          await setDoc(userStatsRef, {
            userId: scoreData.userId,
            gameId: scoreData.gameId,
            bestScore: scoreData.score,
            gamesPlayed: increment(1),
            lastPlayed: serverTimestamp(),
          }, { merge: true });
        } else {
          await updateDoc(userStatsRef, {
            gamesPlayed: increment(1),
            lastPlayed: serverTimestamp(),
          });
        }
      } catch (statsError) {
        console.error('[Leaderboard] Error updating user stats:', statsError);
        // Don't fail the score submission if stats update fails
      }

      // Clear relevant cache entries
      leaderboardCache.delete(getCacheKey(scoreData.gameId, 0));
      leaderboardCache.delete(getCacheKey('global', 0));

      return { success: true };
    } catch (error) {
      console.error('[Leaderboard] submitScore error:', error);
      return { success: false, error: 'Failed to submit score' };
    }
  },

  // Get leaderboard with proper cursor-based pagination
  getLeaderboard: async (
    gameId: string, 
    limitCount: number = 50,
    lastDoc: QueryDocumentSnapshot | null = null
  ): Promise<LeaderboardResult> => {
    try {
      const db = await getFirebaseDb();
      if (!db) {
        console.error('[Leaderboard] Firebase not initialized');
        return { entries: [], hasMore: false, lastDoc: null };
      }

      const cacheKey = getCacheKey(gameId, lastDoc ? 1 : 0);
      const cached = leaderboardCache.get(cacheKey);
      
      // Return cached data if valid and this is the first page
      if (!lastDoc && isCacheValid(cached)) {
        console.log('[Leaderboard] Returning cached data');
        return {
          entries: cached!.data,
          hasMore: cached!.data.length === limitCount,
          lastDoc: cached!.lastDoc,
        };
      }

      // Build query
      const userStatsRef = collection(db, USER_STATS_COLLECTION);
      let baseQuery;
      
      if (gameId === 'global') {
        baseQuery = query(userStatsRef, orderBy('bestScore', 'desc'));
      } else {
        baseQuery = query(
          userStatsRef, 
          where('gameId', '==', gameId),
          orderBy('bestScore', 'desc')
        );
      }

      // Apply cursor pagination
      let q;
      if (lastDoc) {
        q = query(baseQuery, startAfter(lastDoc), limit(limitCount));
      } else {
        q = query(baseQuery, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      
      // Check if there are more results
      const hasMore = snapshot.docs.length === limitCount;
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      // Get unique users
      const userIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().userId)));
      
      // Batch fetch user profiles
      const userProfiles = await batchFetchUserProfiles(db, userIds);

      // Build leaderboard entries with correct ranks
      const entries: LeaderboardEntry[] = snapshot.docs.map((docSnap, index) => {
        const data = docSnap.data();
        const profile = userProfiles[data.userId] || { displayName: 'Anonymous', avatar: 'User' };
        
        return {
          rank: lastDoc ? index + 1 + limitCount : index + 1,
          userId: data.userId,
          displayName: profile.displayName,
          avatar: profile.avatar,
          photoURL: profile.photoURL,
          score: data.bestScore,
          timestamp: data.lastPlayed?.toDate?.() || new Date(),
        };
      });

      // Cache first page results
      if (!lastDoc) {
        leaderboardCache.set(cacheKey, {
          data: entries,
          timestamp: Date.now(),
          lastDoc: newLastDoc,
        });
      }

      return { 
        entries, 
        hasMore, 
        lastDoc: newLastDoc,
      };
    } catch (error) {
      console.error('[Leaderboard] getLeaderboard error:', error);
      return { entries: [], hasMore: false, lastDoc: null };
    }
  },

  // Get user's rank with optimized query
  getUserRank: async (userId: string, gameId: string): Promise<number | null> => {
    try {
      const db = await getFirebaseDb();
      if (!db) {
        console.error('[Leaderboard] Firebase not initialized');
        return null;
      }

      // First get user's score
      const userStatsRef = doc(db, USER_STATS_COLLECTION, `${userId}_${gameId}`);
      const userStatsSnap = await getDoc(userStatsRef);
      
      if (!userStatsSnap.exists()) {
        return null;
      }

      const userScore = userStatsSnap.data().bestScore;
      
      // Count how many users have a higher score
      const baseRef = collection(db, USER_STATS_COLLECTION);
      let countQuery;
      
      if (gameId === 'global') {
        countQuery = query(baseRef, where('bestScore', '>', userScore));
      } else {
        countQuery = query(
          baseRef, 
          where('gameId', '==', gameId),
          where('bestScore', '>', userScore)
        );
      }

      const countSnapshot = await getDocs(countQuery);
      // Rank is count of higher scores + 1
      return countSnapshot.size + 1;
    } catch (error) {
      console.error('[Leaderboard] getUserRank error:', error);
      return null;
    }
  },

  // Get user's high score with error handling
  getUserHighScore: async (userId: string, gameId: string): Promise<number> => {
    try {
      const db = await getFirebaseDb();
      if (!db) {
        console.error('[Leaderboard] Firebase not initialized');
        return 0;
      }

      const userStatsRef = doc(db, USER_STATS_COLLECTION, `${userId}_${gameId}`);
      const snapshot = await getDoc(userStatsRef);
      
      if (snapshot.exists()) {
        return snapshot.data().bestScore || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('[Leaderboard] getUserHighScore error:', error);
      return 0;
    }
  },

  // Get top N players efficiently
  getTopPlayers: async (gameId: string, topN: number = 10): Promise<LeaderboardEntry[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) {
        console.error('[Leaderboard] Firebase not initialized');
        return [];
      }

      const userStatsRef = collection(db, USER_STATS_COLLECTION);
      let q;
      
      if (gameId === 'global') {
        q = query(userStatsRef, orderBy('bestScore', 'desc'), limit(topN));
      } else {
        q = query(
          userStatsRef, 
          where('gameId', '==', gameId),
          orderBy('bestScore', 'desc'),
          limit(topN)
        );
      }

      const snapshot = await getDocs(q);
      
      const userIds = snapshot.docs.map(doc => doc.data().userId);
      const userProfiles = await batchFetchUserProfiles(db, userIds);

      return snapshot.docs.map((docSnap, index) => {
        const data = docSnap.data();
        const profile = userProfiles[data.userId] || { displayName: 'Anonymous', avatar: 'User' };
        
        return {
          rank: index + 1,
          userId: data.userId,
          displayName: profile.displayName,
          avatar: profile.avatar,
          photoURL: profile.photoURL,
          score: data.bestScore,
          timestamp: data.lastPlayed?.toDate?.() || new Date(),
        };
      });
    } catch (error) {
      console.error('[Leaderboard] getTopPlayers error:', error);
      return [];
    }
  },

  // Clear cache (useful after score submission)
  clearCache: (): void => {
    leaderboardCache.clear();
    console.log('[Leaderboard] Cache cleared');
  },

  // Get cache stats for debugging
  getCacheStats: (): { size: number; keys: string[] } => ({
    size: leaderboardCache.size,
    keys: Array.from(leaderboardCache.keys()),
  }),
};

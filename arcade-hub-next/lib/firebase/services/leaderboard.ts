import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';
import { LeaderboardEntry } from '@/types/game';

const SCORES_COLLECTION = 'scores';
const USER_STATS_COLLECTION = 'userStats';

export interface ScoreData {
  userId: string;
  displayName: string;
  avatar: string;
  gameId: string;
  score: number;
  timestamp: Date;
}

export const leaderboardService = {
  // Submit a new score
  submitScore: async (scoreData: Omit<ScoreData, 'timestamp'>): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firebase not initialized');

    const scoresRef = collection(db, SCORES_COLLECTION);
    
    // Add the score
    await addDoc(scoresRef, {
      ...scoreData,
      timestamp: serverTimestamp(),
    });

    // Update user's best score for this game
    const userStatsRef = doc(db, USER_STATS_COLLECTION, `${scoreData.userId}_${scoreData.gameId}`);
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
  },

  // Get leaderboard for a specific game
  getLeaderboard: async (gameId: string, limitCount: number = 50): Promise<LeaderboardEntry[]> => {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firebase not initialized');

    // Get user's best scores for each game
    const userStatsRef = collection(db, USER_STATS_COLLECTION);
    let q;
    
    if (gameId === 'global') {
      // Global leaderboard - sum of all best scores per user
      q = query(userStatsRef, orderBy('bestScore', 'desc'), limit(limitCount));
    } else {
      q = query(
        userStatsRef, 
        where('gameId', '==', gameId),
        orderBy('bestScore', 'desc'), 
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    
    // Get unique users and their display info
    const userIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().userId)));
    
    // Fetch user profiles
    const userProfiles: Record<string, { displayName: string; avatar: string; photoURL?: string }> = {};
    for (const userId of userIds) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        userProfiles[userId] = {
          displayName: data.displayName || 'Anonymous',
          avatar: data.avatar || 'User',
          photoURL: data.photoURL,
        };
      }
    }

    // Build leaderboard entries
    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const profile = userProfiles[data.userId] || { displayName: 'Anonymous', avatar: 'User' };
      
      entries.push({
        rank,
        userId: data.userId,
        displayName: profile.displayName,
        avatar: profile.avatar,
        photoURL: profile.photoURL,
        score: data.bestScore,
        timestamp: data.lastPlayed?.toDate() || new Date(),
      });
      rank++;
    }

    return entries;
  },

  // Get user's rank for a specific game
  getUserRank: async (userId: string, gameId: string): Promise<number | null> => {
    const db = await getFirebaseDb();
    if (!db) throw new Error('Firebase not initialized');

    const userStatsRef = collection(db, USER_STATS_COLLECTION);
    let q;
    
    if (gameId === 'global') {
      q = query(userStatsRef, orderBy('bestScore', 'desc'));
    } else {
      q = query(
        userStatsRef, 
        where('gameId', '==', gameId),
        orderBy('bestScore', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    let rank = 1;
    
    for (const docSnap of snapshot.docs) {
      if (docSnap.data().userId === userId) {
        return rank;
      }
      rank++;
    }
    
    return null;
  },

  // Get user's high score for a game
  getUserHighScore: async (userId: string, gameId: string): Promise<number> => {
    const db = await getFirebaseDb();
    if (!db) return 0;

    const userStatsRef = doc(db, USER_STATS_COLLECTION, `${userId}_${gameId}`);
    const snapshot = await getDoc(userStatsRef);
    
    if (snapshot.exists()) {
      return snapshot.data().bestScore || 0;
    }
    
    return 0;
  },
};

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

const ACHIEVEMENTS_COLLECTION = 'achievements';
const USER_ACHIEVEMENTS_COLLECTION = 'userAchievements';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  coinReward: number;
}

export interface UserAchievement {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

// Default achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-game',
    name: 'First Steps',
    description: 'Play your first game',
    icon: 'Gamepad2',
    maxProgress: 1,
    rarity: 'common',
    xpReward: 25,
    coinReward: 10,
  },
  {
    id: 'score-1000',
    name: 'Score Hunter',
    description: 'Score 1,000 points in any game',
    icon: 'Trophy',
    maxProgress: 1000,
    rarity: 'common',
    xpReward: 50,
    coinReward: 25,
  },
  {
    id: 'score-10000',
    name: 'High Scorer',
    description: 'Score 10,000 points in any game',
    icon: 'Trophy',
    maxProgress: 10000,
    rarity: 'rare',
    xpReward: 100,
    coinReward: 50,
  },
  {
    id: 'play-10-games',
    name: 'Dedicated Player',
    description: 'Play 10 games',
    icon: 'Target',
    maxProgress: 10,
    rarity: 'common',
    xpReward: 50,
    coinReward: 25,
  },
  {
    id: 'play-50-games',
    name: 'Veteran',
    description: 'Play 50 games',
    icon: 'Target',
    maxProgress: 50,
    rarity: 'rare',
    xpReward: 150,
    coinReward: 75,
  },
  {
    id: 'play-100-games',
    name: 'Arcade Addict',
    description: 'Play 100 games',
    icon: 'Target',
    maxProgress: 100,
    rarity: 'epic',
    xpReward: 300,
    coinReward: 150,
  },
  {
    id: 'all-games',
    name: 'Explorer',
    description: 'Play every game in the hub',
    icon: 'Sparkles',
    maxProgress: 8,
    rarity: 'rare',
    xpReward: 100,
    coinReward: 50,
  },
  {
    id: 'top-10',
    name: 'Top 10',
    description: 'Reach top 10 on any leaderboard',
    icon: 'Medal',
    maxProgress: 1,
    rarity: 'epic',
    xpReward: 200,
    coinReward: 100,
  },
  {
    id: 'master',
    name: 'Arcade Master',
    description: 'Unlock all other achievements',
    icon: 'Crown',
    maxProgress: 8,
    rarity: 'legendary',
    xpReward: 1000,
    coinReward: 500,
  },
];

export const achievementsService = {
  // Initialize default achievements in Firestore
  initializeAchievements: async (): Promise<void> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return;

      const achievementsRef = collection(db, ACHIEVEMENTS_COLLECTION);
      
      for (const achievement of DEFAULT_ACHIEVEMENTS) {
        try {
          const achievementDoc = doc(achievementsRef, achievement.id);
          const snapshot = await getDoc(achievementDoc);
          
          if (!snapshot.exists()) {
            await setDoc(achievementDoc, achievement);
          }
        } catch (e) {
          // Skip if cannot write
        }
      }
    } catch (e) {
      // Initialization failed, use defaults
    }
  },

  // Get all achievements
  getAllAchievements: async (): Promise<Achievement[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return DEFAULT_ACHIEVEMENTS;

      const achievementsRef = collection(db, ACHIEVEMENTS_COLLECTION);
      const snapshot = await getDocs(achievementsRef);
      
      if (snapshot.empty) {
        // Try to initialize if not exists
        await achievementsService.initializeAchievements();
        return DEFAULT_ACHIEVEMENTS;
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Achievement[];
    } catch (error) {
      // Return defaults on any error
      return DEFAULT_ACHIEVEMENTS;
    }
  },

  // Get user's achievements
  getUserAchievements: async (userId: string): Promise<UserAchievement[]> => {
    try {
      const db = await getFirebaseDb();
      
      // Try localStorage first
      const localKey = `achievements_${userId}`;
      const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
      
      if (!db) {
        return localData ? JSON.parse(localData) : [];
      }

      const userAchievementsRef = collection(db, USER_ACHIEVEMENTS_COLLECTION);
      const q = query(userAchievementsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const achievements = snapshot.docs.map(doc => ({
        achievementId: doc.data().achievementId,
        progress: doc.data().progress || 0,
        unlocked: doc.data().unlocked || false,
        unlockedAt: doc.data().unlockedAt?.toDate(),
      }));
      
      // Cache to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(achievements));
      }
      
      return achievements;
    } catch (error) {
      // Fallback to localStorage
      const localKey = `achievements_${userId}`;
      const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
      return localData ? JSON.parse(localData) : [];
    }
  },

  // Update achievement progress
  updateProgress: async (
    userId: string, 
    achievementId: string, 
    progress: number
  ): Promise<boolean> => {
    try {
      const db = await getFirebaseDb();
      
      // Get achievement details
      let achievement: Achievement | undefined;
      
      if (db) {
        const achievementDoc = doc(db, ACHIEVEMENTS_COLLECTION, achievementId);
        const achievementSnap = await getDoc(achievementDoc);
        if (achievementSnap.exists()) {
          achievement = achievementSnap.data() as Achievement;
        }
      }
      
      // Fallback to default achievements
      if (!achievement) {
        achievement = DEFAULT_ACHIEVEMENTS.find(a => a.id === achievementId);
      }
      
      if (!achievement) return false;
      
      // Get current progress from localStorage
      const localKey = `achievements_progress_${userId}`;
      const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
      const progressMap = localData ? JSON.parse(localData) : {};
      const currentProgress = progressMap[achievementId] || 0;
      
      // Only update if progress increased
      if (progress <= currentProgress) return false;
      
      const newProgress = Math.min(progress, achievement.maxProgress);
      const unlocked = newProgress >= achievement.maxProgress;
      
      // Update localStorage
      progressMap[achievementId] = newProgress;
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(progressMap));
      }
      
      // Try to update Firebase
      if (db) {
        try {
          const userAchievementRef = doc(
            db, 
            USER_ACHIEVEMENTS_COLLECTION, 
            `${userId}_${achievementId}`
          );
          
          await setDoc(userAchievementRef, {
            userId,
            achievementId,
            progress: newProgress,
            unlocked,
            unlockedAt: unlocked ? serverTimestamp() : null,
            updatedAt: serverTimestamp(),
          });
        } catch (firebaseError) {
          // Firebase update failed but localStorage succeeded
        }
      }
      
      return unlocked;
    } catch (error) {
      return false;
    }
  },

  // Track game played for achievements
  trackGamePlayed: async (userId: string, gameId: string, score: number): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    // Update first game achievement
    await achievementsService.updateProgress(userId, 'first-game', 1);
    
    // Update score achievements
    await achievementsService.updateProgress(userId, 'score-1000', score);
    await achievementsService.updateProgress(userId, 'score-10000', score);
    
    // Track games played
    const userAchievementsRef = collection(db, USER_ACHIEVEMENTS_COLLECTION);
    const q = query(userAchievementsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const gamesPlayed = snapshot.docs.filter(
      doc => doc.data().achievementId === 'first-game' && doc.data().progress > 0
    ).length;
    
    await achievementsService.updateProgress(userId, 'play-10-games', gamesPlayed);
    await achievementsService.updateProgress(userId, 'play-50-games', gamesPlayed);
    await achievementsService.updateProgress(userId, 'play-100-games', gamesPlayed);
    
    // Track unique games played
    const uniqueGamesQuery = query(
      userAchievementsRef, 
      where('userId', '==', userId),
      where('achievementId', '==', 'all-games')
    );
    const uniqueGamesSnap = await getDocs(uniqueGamesQuery);
    const uniqueGames = uniqueGamesSnap.docs[0]?.data().gamesPlayed || [];
    
    if (!uniqueGames.includes(gameId)) {
      uniqueGames.push(gameId);
      await achievementsService.updateProgress(userId, 'all-games', uniqueGames.length);
      
      // Update the games list
      const userAchievementRef = doc(db, USER_ACHIEVEMENTS_COLLECTION, `${userId}_all-games`);
      await setDoc(userAchievementRef, { gamesPlayed: uniqueGames }, { merge: true });
    }
  },
};

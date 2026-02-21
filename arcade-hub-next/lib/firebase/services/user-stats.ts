import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

const USERS_COLLECTION = 'users';

export interface UserStats {
  totalScore: number;
  gamesPlayed: number;
  totalPlayTime: number; // in minutes
  achievementsUnlocked: number;
  coins: number;
  level: number;
  xp: number;
  lastPlayed: Date;
}

export const userStatsService = {
  // Get user stats
  getUserStats: async (userId: string): Promise<UserStats> => {
    const db = await getFirebaseDb();
    if (!db) {
      return {
        totalScore: 0,
        gamesPlayed: 0,
        totalPlayTime: 0,
        achievementsUnlocked: 0,
        coins: 0,
        level: 1,
        xp: 0,
        lastPlayed: new Date(),
      };
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        totalScore: data.totalScore || 0,
        gamesPlayed: data.gamesPlayed || 0,
        totalPlayTime: data.totalPlayTime || 0,
        achievementsUnlocked: data.achievementsUnlocked || 0,
        coins: data.coins || 0,
        level: data.level || 1,
        xp: data.xp || 0,
        lastPlayed: data.lastPlayed?.toDate() || new Date(),
      };
    }

    // Initialize new user stats
    const defaultStats: UserStats = {
      totalScore: 0,
      gamesPlayed: 0,
      totalPlayTime: 0,
      achievementsUnlocked: 0,
      coins: 0,
      level: 1,
      xp: 0,
      lastPlayed: new Date(),
    };

    await setDoc(userRef, {
      ...defaultStats,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return defaultStats;
  },

  // Update user stats after game
  updateAfterGame: async (
    userId: string, 
    gameScore: number, 
    playTime: number
  ): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const userRef = doc(db, USERS_COLLECTION, userId);
    
    // Calculate XP gained (1 XP per 100 points, minimum 1)
    const xpGained = Math.max(1, Math.floor(gameScore / 100));
    
    await updateDoc(userRef, {
      totalScore: increment(gameScore),
      gamesPlayed: increment(1),
      totalPlayTime: increment(playTime),
      xp: increment(xpGained),
      lastPlayed: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Check for level up
    await userStatsService.checkLevelUp(userId);
  },

  // Check and apply level up
  checkLevelUp: async (userId: string): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const userRef = doc(db, USERS_COLLECTION, userId);
    const snapshot = await getDoc(userRef);
    
    if (!snapshot.exists()) return;
    
    const data = snapshot.data();
    const currentLevel = data.level || 1;
    const currentXp = data.xp || 0;
    
    // XP required for next level = level * 100
    const xpRequired = currentLevel * 100;
    
    if (currentXp >= xpRequired) {
      const newLevel = currentLevel + 1;
      const remainingXp = currentXp - xpRequired;
      
      // Award coins for leveling up
      const coinReward = newLevel * 50;
      
      await updateDoc(userRef, {
        level: newLevel,
        xp: remainingXp,
        coins: increment(coinReward),
        updatedAt: serverTimestamp(),
      });
    }
  },

  // Add coins (for completing challenges, etc.)
  addCoins: async (userId: string, amount: number): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      coins: increment(amount),
      updatedAt: serverTimestamp(),
    });
  },

  // Spend coins (for shop purchases)
  spendCoins: async (userId: string, amount: number): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const userRef = doc(db, USERS_COLLECTION, userId);
    const snapshot = await getDoc(userRef);
    
    if (!snapshot.exists()) return false;
    
    const currentCoins = snapshot.data().coins || 0;
    
    if (currentCoins < amount) {
      return false; // Not enough coins
    }
    
    await updateDoc(userRef, {
      coins: increment(-amount),
      updatedAt: serverTimestamp(),
    });
    
    return true;
  },

  // Increment achievements count
  incrementAchievements: async (userId: string): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      achievementsUnlocked: increment(1),
      updatedAt: serverTimestamp(),
    });
  },
};

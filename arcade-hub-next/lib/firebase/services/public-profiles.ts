import { 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';
import { achievementsService } from './achievements';
import { userStatsService } from './user-stats';

export interface PublicProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  photoURL?: string;
  level: number;
  title?: string;
  titleColor?: string;
  totalAchievements: number;
  totalScore: number;
  gamesPlayed: number;
  favoriteGame?: string;
  recentAchievements: {
    id: string;
    name: string;
    icon: string;
    unlockedAt: Date;
  }[];
  isOnline: boolean;
  lastSeen: Date;
  joinedAt: Date;
}

export const publicProfilesService = {
  // Get public profile for a user
  getPublicProfile: async (userId: string): Promise<PublicProfile | null> => {
    const db = await getFirebaseDb();
    if (!db) return null;

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();

    // Get user stats
    const userStats = await userStatsService.getUserStats(userId);

    // Get achievements
    const allAchievements = await achievementsService.getAllAchievements();
    const userAchievements = await achievementsService.getUserAchievements(userId);
    const unlockedAchievements = userAchievements.filter(ua => ua.unlocked);

    // Get recent achievements
    const recentAchievements = unlockedAchievements
      .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
      .slice(0, 3)
      .map(ua => {
        const achievement = allAchievements.find(a => a.id === ua.achievementId);
        return {
          id: ua.achievementId,
          name: achievement?.name || 'Unknown',
          icon: achievement?.icon || 'Trophy',
          unlockedAt: ua.unlockedAt || new Date(),
        };
      });

    // Get presence
    const presenceDoc = await getDoc(doc(db, 'presence', userId));
    const presenceData = presenceDoc.exists() ? presenceDoc.data() : {};

    return {
      userId,
      displayName: userData.displayName || 'Anonymous',
      avatar: userData.avatar,
      photoURL: userData.photoURL,
      level: userStats.level,
      title: userData.title,
      titleColor: userData.titleColor,
      totalAchievements: unlockedAchievements.length,
      totalScore: userStats.totalScore,
      gamesPlayed: userStats.gamesPlayed,
      favoriteGame: userData.favoriteGame,
      recentAchievements,
      isOnline: presenceData.online || false,
      lastSeen: presenceData.lastSeen?.toDate() || new Date(),
      joinedAt: userData.createdAt?.toDate() || new Date(),
    };
  },

  // Update own public profile
  updatePublicProfile: async (userId: string, updates: Partial<PublicProfile>): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const publicProfileRef = doc(db, 'publicProfiles', userId);
    
    await setDoc(publicProfileRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
  },

  // Sync public profile from user data (call this when user stats change)
  syncPublicProfile: async (userId: string): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const profile = await publicProfilesService.getPublicProfile(userId);
    if (!profile) return;

    const publicProfileRef = doc(db, 'publicProfiles', userId);
    await setDoc(publicProfileRef, {
      userId,
      displayName: profile.displayName,
      avatar: profile.avatar,
      photoURL: profile.photoURL,
      level: profile.level,
      title: profile.title,
      totalAchievements: profile.totalAchievements,
      totalScore: profile.totalScore,
      gamesPlayed: profile.gamesPlayed,
      favoriteGame: profile.favoriteGame,
      isOnline: profile.isOnline,
      lastSeen: profile.lastSeen,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },
};

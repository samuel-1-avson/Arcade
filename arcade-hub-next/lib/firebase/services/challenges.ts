import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

const CHALLENGES_COLLECTION = 'challenges';
const USER_CHALLENGES_COLLECTION = 'userChallenges';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  game: string;
  target: number;
  reward: number;
  expiresAt: Date;
  active: boolean;
}

export interface UserChallenge {
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  claimed: boolean;
}

// Generate daily/weekly challenges
const generateDailyChallenges = (): Omit<Challenge, 'id'>[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return [
    {
      title: 'Snake Master',
      description: 'Score 500 points in Snake',
      game: 'snake',
      target: 500,
      reward: 50,
      expiresAt: tomorrow,
      active: true,
    },
    {
      title: 'Pac-Man Hunter',
      description: 'Score 1000 points in Pac-Man',
      game: 'pacman',
      target: 1000,
      reward: 75,
      expiresAt: tomorrow,
      active: true,
    },
    {
      title: 'Tetris Stacker',
      description: 'Clear 20 lines in Tetris',
      game: 'tetris',
      target: 20,
      reward: 60,
      expiresAt: tomorrow,
      active: true,
    },
  ];
};

const generateWeeklyChallenges = (): Omit<Challenge, 'id'>[] => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

  return [
    {
      title: 'Weekly Warrior',
      description: 'Play 20 games this week',
      game: 'any',
      target: 20,
      reward: 200,
      expiresAt: nextWeek,
      active: true,
    },
    {
      title: 'High Score Hero',
      description: 'Achieve a total score of 5000 across all games',
      game: 'any',
      target: 5000,
      reward: 300,
      expiresAt: nextWeek,
      active: true,
    },
  ];
};

export const challengesService = {
  // Initialize daily challenges
  initializeDailyChallenges: async (): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const challengesRef = collection(db, CHALLENGES_COLLECTION);
    
    // Check if today's challenges exist
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      challengesRef,
      where('expiresAt', '>', Timestamp.fromDate(today))
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) return; // Already initialized
    
    // Create daily challenges
    const dailyChallenges = generateDailyChallenges();
    for (const challenge of dailyChallenges) {
      await setDoc(doc(challengesRef), {
        ...challenge,
        type: 'daily',
        createdAt: serverTimestamp(),
      });
    }
    
    // Create weekly challenges (only on Mondays or if none exist)
    const dayOfWeek = new Date().getDay();
    const weeklyExists = !(await getDocs(
      query(challengesRef, where('type', '==', 'weekly'))
    )).empty;
    
    if (dayOfWeek === 1 || !weeklyExists) {
      const weeklyChallenges = generateWeeklyChallenges();
      for (const challenge of weeklyChallenges) {
        await setDoc(doc(challengesRef), {
          ...challenge,
          type: 'weekly',
          createdAt: serverTimestamp(),
        });
      }
    }
  },

  // Get active challenges
  getActiveChallenges: async (): Promise<Challenge[]> => {
    const db = await getFirebaseDb();
    if (!db) {
      // Return default challenges if no DB
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return [
        {
          id: 'daily-1',
          title: 'Snake Master',
          description: 'Score 500 points in Snake',
          game: 'snake',
          target: 500,
          reward: 50,
          expiresAt: tomorrow,
          active: true,
        },
        {
          id: 'weekly-1',
          title: 'Weekly Warrior',
          description: 'Play 20 games this week',
          game: 'any',
          target: 20,
          reward: 200,
          expiresAt: tomorrow,
          active: true,
        },
      ];
    }

    // Initialize if needed
    await challengesService.initializeDailyChallenges();
    
    const challengesRef = collection(db, CHALLENGES_COLLECTION);
    const now = Timestamp.now();
    
    const q = query(
      challengesRef,
      where('expiresAt', '>', now),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      description: doc.data().description,
      game: doc.data().game,
      target: doc.data().target,
      reward: doc.data().reward,
      expiresAt: doc.data().expiresAt.toDate(),
      active: doc.data().active,
    }));
  },

  // Get user's challenge progress
  getUserChallenges: async (userId: string): Promise<UserChallenge[]> => {
    const db = await getFirebaseDb();
    if (!db) return [];

    const userChallengesRef = collection(db, USER_CHALLENGES_COLLECTION);
    const q = query(userChallengesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      challengeId: doc.data().challengeId,
      progress: doc.data().progress || 0,
      completed: doc.data().completed || false,
      completedAt: doc.data().completedAt?.toDate(),
      claimed: doc.data().claimed || false,
    }));
  },

  // Update challenge progress
  updateProgress: async (
    userId: string,
    gameId: string,
    score: number
  ): Promise<{ completed: string[]; rewards: number }> => {
    const db = await getFirebaseDb();
    if (!db) return { completed: [], rewards: 0 };

    const completed: string[] = [];
    let totalRewards = 0;

    // Get active challenges for this game
    const challenges = await challengesService.getActiveChallenges();
    const relevantChallenges = challenges.filter(
      c => c.game === 'any' || c.game === gameId
    );

    for (const challenge of relevantChallenges) {
      const userChallengeRef = doc(
        db,
        USER_CHALLENGES_COLLECTION,
        `${userId}_${challenge.id}`
      );
      
      const userChallengeSnap = await getDoc(userChallengeRef);
      const userChallenge = userChallengeSnap.exists() 
        ? userChallengeSnap.data() 
        : { progress: 0, completed: false };
      
      if (userChallenge.completed) continue;
      
      // Calculate progress based on challenge type
      let newProgress = userChallenge.progress;
      
      if (challenge.game === 'any' && challenge.title.includes('Score')) {
        // Score-based challenge
        newProgress += score;
      } else if (challenge.game === 'any' && challenge.title.includes('Play')) {
        // Play count challenge - handled separately
        newProgress += 1;
      } else {
        // Game-specific score challenge
        newProgress = Math.max(newProgress, score);
      }
      
      const isCompleted = newProgress >= challenge.target;
      
      await setDoc(userChallengeRef, {
        userId,
        challengeId: challenge.id,
        progress: Math.min(newProgress, challenge.target),
        completed: isCompleted,
        completedAt: isCompleted ? serverTimestamp() : null,
        claimed: false,
        updatedAt: serverTimestamp(),
      });
      
      if (isCompleted && !userChallenge.completed) {
        completed.push(challenge.id);
        totalRewards += challenge.reward;
      }
    }

    return { completed, rewards: totalRewards };
  },

  // Claim challenge reward
  claimReward: async (userId: string, challengeId: string): Promise<boolean> => {
    const db = await getFirebaseDb();
    if (!db) return false;

    const userChallengeRef = doc(
      db,
      USER_CHALLENGES_COLLECTION,
      `${userId}_${challengeId}`
    );
    
    const userChallengeSnap = await getDoc(userChallengeRef);
    if (!userChallengeSnap.exists()) return false;
    
    const data = userChallengeSnap.data();
    if (!data.completed || data.claimed) return false;
    
    await updateDoc(userChallengeRef, {
      claimed: true,
      updatedAt: serverTimestamp(),
    });
    
    return true;
  },
};

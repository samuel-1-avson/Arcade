import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as firebaseUpdateProfile,
  Auth
} from 'firebase/auth';
import { getFirebaseAuth } from './config';
import { User, UserPreferences } from '@/types/user';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Use POPUP by default - it's more reliable for this use case
  signInWithGoogle: async (): Promise<User | null> => {
    // Starting Google sign-in with popup
    const auth = await getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Popup sign-in successful
      return mapFirebaseUser(result.user);
    } catch (error: any) {
      // Error handled by caller
      
      // If popup is blocked, fall back to redirect
      if (error?.code === 'auth/popup-blocked') {
        // Popup blocked, falling back to redirect
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      
      throw error;
    }
  },

  handleRedirectResult: async (): Promise<User | null> => {
    try {
      // Checking for redirect result
      const auth = await getFirebaseAuth();
      if (!auth) {
        // Auth not initialized
        return null;
      }
      
      const result = await getRedirectResult(auth);
      if (result && result.user) {
      // Redirect result found
        return mapFirebaseUser(result.user);
      }
      // No redirect result found
      return null;
    } catch (error: any) {
      // Error handled by caller
      return null;
    }
  },
  
  signInAsGuest: async (): Promise<User> => {
    const auth = await getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    const result = await signInAnonymously(auth);
    return mapFirebaseUser(result.user);
  },
  
  signOut: async () => {
    const auth = await getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    return firebaseSignOut(auth);
  },
  
  onAuthChange: (callback: (user: User | null) => void) => {
    let unsubscribe: (() => void) | null = null;
    
    getFirebaseAuth().then((auth) => {
      if (!auth) {
        // Cannot listen to auth changes - Firebase not initialized
        callback(null);
        return;
      }
      
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Auth state changed
        callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      });
    });
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  },
  
  updateUserProfile: async (displayName: string, photoURL?: string) => {
    const auth = await getFirebaseAuth();
    if (auth && auth.currentUser) {
      await firebaseUpdateProfile(auth.currentUser, { displayName, photoURL });
    }
  },
};

function mapFirebaseUser(fbUser: FirebaseUser): User {
  const defaultPreferences: UserPreferences = {
    soundEnabled: true,
    musicEnabled: true,
    notificationsEnabled: true,
    theme: 'dark',
  };

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || 'Guest',
    avatar: fbUser.photoURL || '/avatars/default.png',
    level: 1,
    xp: 0,
    totalScore: 0,
    gamesPlayed: 0,
    createdAt: new Date(fbUser.metadata.creationTime || Date.now()),
    preferences: defaultPreferences,
  };
}

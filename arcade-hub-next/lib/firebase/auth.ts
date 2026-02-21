import { 
  signInWithRedirect, 
  signInWithPopup,
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

// Always use redirect for production to avoid COOP issues
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   !window.location.hostname.includes('localhost'));

export const authService = {
  signInWithGoogle: async (): Promise<User | null> => {
    console.log('Sign-in initiated, production:', isProduction);
    const auth = await getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    if (isProduction) {
      console.log('Using redirect flow...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else {
      console.log('Using popup flow...');
      const result = await signInWithPopup(auth, googleProvider);
      return mapFirebaseUser(result.user);
    }
  },

  handleRedirectResult: async (): Promise<User | null> => {
    try {
      console.log('Checking for redirect result...');
      const auth = await getFirebaseAuth();
      if (!auth) {
        console.error('Auth not initialized');
        return null;
      }
      
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        console.log('Redirect result found:', result.user.email);
        return mapFirebaseUser(result.user);
      }
      console.log('No redirect result found');
      return null;
    } catch (error: any) {
      console.error('Redirect result error:', error?.code, error?.message);
      if (error?.code === 'auth/unauthorized-domain') {
        console.error('Domain not authorized in Firebase Console!');
        alert('This domain is not authorized for authentication.');
      }
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
    // Return a function that will set up the listener once auth is ready
    let unsubscribe: (() => void) | null = null;
    
    getFirebaseAuth().then((auth) => {
      if (!auth) {
        console.error('Cannot listen to auth changes - Firebase not initialized');
        callback(null);
        return;
      }
      
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        console.log('Firebase auth state changed:', firebaseUser?.email || 'null');
        callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      });
    });
    
    // Return unsubscribe function
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

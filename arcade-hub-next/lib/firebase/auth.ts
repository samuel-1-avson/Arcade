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

// Helper to get auth instance safely
function getAuth(): Auth {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Make sure Firebase is configured properly.');
  }
  return auth;
}

// Always use redirect for production to avoid COOP issues
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   !window.location.hostname.includes('localhost'));

export const authService = {
  signInWithGoogle: async (): Promise<User | null> => {
    console.log('Sign-in initiated, production:', isProduction);
    const auth = getAuth();
    
    if (isProduction) {
      // For production - use redirect flow (more reliable for static hosting)
      console.log('Using redirect flow...');
      await signInWithRedirect(auth, googleProvider);
      return null; // Will redirect, so this won't complete
    } else {
      // For local dev - use popup
      console.log('Using popup flow...');
      const result = await signInWithPopup(auth, googleProvider);
      return mapFirebaseUser(result.user);
    }
  },

  handleRedirectResult: async (): Promise<User | null> => {
    try {
      console.log('Checking for redirect result...');
      const auth = getAuth();
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        console.log('Redirect result found:', result.user.email);
        return mapFirebaseUser(result.user);
      }
      console.log('No redirect result found');
      return null;
    } catch (error: any) {
      console.error('Redirect result error:', error.code, error.message);
      // Handle specific errors
      if (error.code === 'auth/unauthorized-domain') {
        console.error('Domain not authorized in Firebase Console!');
        alert('This domain is not authorized for authentication. Please add it to Firebase Console > Authentication > Settings > Authorized domains.');
      }
      return null;
    }
  },
  
  signInAsGuest: async (): Promise<User> => {
    const auth = getAuth();
    const result = await signInAnonymously(auth);
    return mapFirebaseUser(result.user);
  },
  
  signOut: async () => {
    const auth = getAuth();
    return firebaseSignOut(auth);
  },
  
  onAuthChange: (callback: (user: User | null) => void) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error('Cannot listen to auth changes - Firebase not initialized');
      // Return a no-op unsubscribe function
      return () => {};
    }
    
    return onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser?.email || 'null');
      callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
    });
  },
  
  updateUserProfile: async (displayName: string, photoURL?: string) => {
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      await firebaseUpdateProfile(auth.currentUser, { displayName, photoURL });
    }
  },
  
  // Helper to check if current domain is authorized
  isDomainAuthorized: (): boolean => {
    if (typeof window === 'undefined') return true;
    const hostname = window.location.hostname;
    // Firebase Auth automatically authorizes localhost and the project's default domain
    // For other domains, they need to be manually added
    return hostname.includes('localhost') || 
           hostname.includes('firebaseapp.com') ||
           hostname.includes('vercel.app'); // This needs to be added to Firebase Console
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

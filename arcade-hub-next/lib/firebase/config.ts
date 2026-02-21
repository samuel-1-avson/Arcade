import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Trim environment variables to remove any trailing newlines
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
};

// Singleton pattern for Firebase instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initPromise: Promise<{ app: FirebaseApp | null; auth: Auth | null; db: Firestore | null }> | null = null;

async function initFirebase() {
  if (typeof window === 'undefined') {
    return { app: null, auth: null, db: null };
  }
  
  // Return existing instances if already initialized
  if (app && auth) {
    return { app, auth, db };
  }
  
  // Return existing initialization promise if in progress
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      if (getApps().length === 0) {
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
          console.error('Firebase API key is missing.');
          return { app: null, auth: null, db: null };
        }
        
        console.log('Initializing Firebase...');
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
        console.log('Using existing Firebase app');
      }
      
      auth = getAuth(app);
      
      // Set persistence to local to maintain auth state
      await setPersistence(auth, browserLocalPersistence);
      console.log('Auth persistence set to local');
      
      db = getFirestore(app);
      
      return { app, auth, db };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return { app: null, auth: null, db: null };
    }
  })();
  
  return initPromise;
}

// Export getter functions
export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  const { app: a } = await initFirebase();
  return a;
}

export async function getFirebaseAuth(): Promise<Auth | null> {
  if (auth) return auth;
  const { auth: a } = await initFirebase();
  return a;
}

export async function getFirebaseDb(): Promise<Firestore | null> {
  if (db) return db;
  const { db: d } = await initFirebase();
  return d;
}

// Synchronous getters (may return null if not initialized yet)
export function getAuthSync(): Auth | null {
  return auth;
}

export function getAppSync(): FirebaseApp | null {
  return app;
}

// For backwards compatibility
export { app, auth, db };

// Analytics (only in browser)
export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  const firebaseApp = await getFirebaseApp();
  if (firebaseApp && typeof window !== 'undefined') {
    if (await isSupported()) {
      return getAnalytics(firebaseApp);
    }
  }
  return null;
};

export default app;

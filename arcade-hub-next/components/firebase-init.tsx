'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';

export function FirebaseInit({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initAuth = async () => {
      setLoading(true);
      
      const auth = await getFirebaseAuth();
      if (!auth) {
        console.error('Firebase Auth not available');
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Check for redirect result FIRST (before setting up listener)
      try {
        console.log('Checking redirect result...');
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Redirect result found:', result.user.email);
        } else {
          console.log('No redirect result');
        }
      } catch (error: any) {
        console.error('Redirect error:', error?.code, error?.message);
        if (error?.code === 'auth/unauthorized-domain') {
          alert('This domain is not authorized. Please add it to Firebase Console.');
        }
      }

      // Set up auth state listener AFTER checking redirect
      console.log('Setting up auth listener...');
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        console.log('Auth state:', firebaseUser?.email || 'null');
        if (firebaseUser) {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Guest',
            avatar: firebaseUser.photoURL || '/avatars/default.png',
            level: 1,
            xp: 0,
            totalScore: 0,
            gamesPlayed: 0,
            createdAt: new Date(),
            preferences: {
              soundEnabled: true,
              musicEnabled: true,
              notificationsEnabled: true,
              theme: 'dark',
            },
          });
        } else {
          setUser(null);
        }
        setLoading(false);
        setInitialized(true);
      });
    };
    
    initAuth();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setUser, setLoading]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

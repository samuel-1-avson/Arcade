'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export function FirebaseInit({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const initAuth = async () => {
      setLoading(true);
      
      const auth = await getFirebaseAuth();
      if (!auth) {
        // Firebase Auth not available - silent fail
        setLoading(false);
        setInitialized(true);
        return;
      }

      // Set up auth state listener
      // Setting up auth listener
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        // Auth state updated
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

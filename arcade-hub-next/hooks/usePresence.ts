'use client';

import { useEffect, useCallback } from 'react';
import { friendsService } from '@/lib/firebase/services/friends';
import { useAuthStore } from '@/lib/store';

export function usePresence() {
  const user = useAuthStore((state) => state.user);

  const updatePresence = useCallback(async (online: boolean, currentGame?: string) => {
    if (!user?.id) return;
    
    try {
      await friendsService.updatePresence(user.id, online, currentGame);
    } catch (error) {
      console.error('[Presence] Failed to update:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Set user as online when they log in
    updatePresence(true);

    // Update presence periodically (every 30 seconds)
    const interval = setInterval(() => {
      updatePresence(true);
    }, 30000);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence(true);
      } else {
        updatePresence(false);
      }
    };

    // Handle before unload (user closing tab)
    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Set offline when component unmounts
      updatePresence(false);
    };
  }, [user?.id, updatePresence]);

  return { updatePresence };
}

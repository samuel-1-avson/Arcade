'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/firebase';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, signOut } = useAuthStore();

  const signInWithGoogle = useCallback(async () => {
    try {
      // Google sign-in started
      const user = await authService.signInWithGoogle();
      // For popup flow, user is returned directly
      if (user) {
        // Sign-in successful
        setUser(user);
      }
      return user;
    } catch (error: any) {
      // Error handled in UI
      
      // Show user-friendly error
      if (error?.code === 'auth/popup-blocked') {
        alert('Please allow popups for this site to sign in with Google.');
      } else if (error?.code === 'auth/cancelled-popup-request') {
        // User cancelled, don't show error
        // User cancelled sign-in - silent fail
      } else {
        alert('Sign-in failed. Please try again.');
      }
      
      throw error;
    }
  }, [setUser]);

  const signInAsGuest = useCallback(async () => {
    try {
      const user = await authService.signInAsGuest();
      setUser(user);
      return user;
    } catch (error) {
      // Error handled in UI
      throw error;
    }
  }, [setUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
      signOut();
    } catch (error) {
      // Error handled in UI
      throw error;
    }
  }, [signOut]);

  const updateProfile = useCallback(async (displayName: string, photoURL?: string) => {
    try {
      await authService.updateUserProfile(displayName, photoURL);
      useAuthStore.getState().updateProfile({ displayName, avatar: photoURL });
    } catch (error) {
      // Error handled in UI
      throw error;
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signInAsGuest,
    signOut: handleSignOut,
    updateProfile,
  };
}

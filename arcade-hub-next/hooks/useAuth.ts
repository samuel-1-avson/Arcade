'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/firebase';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, signOut } = useAuthStore();

  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('Starting Google sign-in...');
      const user = await authService.signInWithGoogle();
      // For redirect flow, this returns null - auth state will update after redirect
      if (user) {
        console.log('Popup sign-in successful:', user.email);
        setUser(user);
      } else {
        console.log('Redirect sign-in initiated...');
      }
      return user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }, [setUser]);

  const signInAsGuest = useCallback(async () => {
    try {
      const user = await authService.signInAsGuest();
      setUser(user);
      return user;
    } catch (error) {
      console.error('Guest sign in error:', error);
      throw error;
    }
  }, [setUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
      signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [signOut]);

  const updateProfile = useCallback(async (displayName: string, photoURL?: string) => {
    try {
      await authService.updateUserProfile(displayName, photoURL);
      useAuthStore.getState().updateProfile({ displayName, avatar: photoURL });
    } catch (error) {
      console.error('Update profile error:', error);
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

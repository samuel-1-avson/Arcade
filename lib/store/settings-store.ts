'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

export interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
}

interface SettingsState extends Settings {
  // Actions
  setSetting: (key: keyof Settings, value: boolean) => void;
  setAllSettings: (settings: Partial<Settings>) => void;
  syncToFirestore: (userId: string) => Promise<void>;
  loadFromFirestore: (userId: string) => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  musicEnabled: true,
  notificationsEnabled: true,
  darkMode: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setSetting: (key, value) => {
        set({ [key]: value });

        // Broadcast to game iframes via window event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('arcade-settings-changed', {
              detail: { key, value, allSettings: { ...get(), [key]: value } },
            })
          );
        }
      },

      setAllSettings: (settings) => {
        set(settings);

        // Broadcast full settings update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('arcade-settings-changed', {
              detail: { allSettings: { ...get(), ...settings } },
            })
          );
        }
      },

      syncToFirestore: async (userId: string) => {
        try {
          const db = await getFirebaseDb();
          if (!db) return;

          const state = get();
          const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');
          await setDoc(prefsRef, {
            soundEnabled: state.soundEnabled,
            musicEnabled: state.musicEnabled,
            notificationsEnabled: state.notificationsEnabled,
            darkMode: state.darkMode,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          console.warn('[Settings] Failed to sync to Firestore:', error);
        }
      },

      loadFromFirestore: async (userId: string) => {
        try {
          const db = await getFirebaseDb();
          if (!db) return;

          const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');
          const prefsDoc = await getDoc(prefsRef);

          if (prefsDoc.exists()) {
            const data = prefsDoc.data();
            const firebaseSettings: Partial<Settings> = {};

            if (typeof data.soundEnabled === 'boolean') firebaseSettings.soundEnabled = data.soundEnabled;
            if (typeof data.musicEnabled === 'boolean') firebaseSettings.musicEnabled = data.musicEnabled;
            if (typeof data.notificationsEnabled === 'boolean') firebaseSettings.notificationsEnabled = data.notificationsEnabled;
            if (typeof data.darkMode === 'boolean') firebaseSettings.darkMode = data.darkMode;

            set(firebaseSettings);
          }
        } catch (error) {
          console.warn('[Settings] Failed to load from Firestore:', error);
        }
      },
    }),
    {
      name: 'arcade_hub_settings',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        notificationsEnabled: state.notificationsEnabled,
        darkMode: state.darkMode,
      }),
    }
  )
);

// Helper to get settings synchronously (for game iframes)
export function getArcadeSettings(): Settings {
  const state = useSettingsStore.getState();
  return {
    soundEnabled: state.soundEnabled,
    musicEnabled: state.musicEnabled,
    notificationsEnabled: state.notificationsEnabled,
    darkMode: state.darkMode,
  };
}

// Expose settings globally for game iframes
if (typeof window !== 'undefined') {
  (window as any).__ARCADE_SETTINGS__ = getArcadeSettings;
}

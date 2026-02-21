export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  level: number;
  xp: number;
  totalScore: number;
  gamesPlayed: number;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'dark' | 'light';
}


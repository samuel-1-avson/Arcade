export type GameIcon = 
  | 'Gamepad2'      // Snake
  | 'Ghost'         // Pac-Man
  | 'Grid3x3'       // Tetris
  | 'Square'        // Breakout
  | 'Sparkles'      // Asteroids
  | 'Bomb'          // Minesweeper
  | 'Calculator'    // 2048
  | 'Circle'        // Tic Tac Toe
  | 'Music'         // Rhythm
  | 'Dungeon'       // Roguelike
  | 'Castle'        // Tower Defense
  | 'Trophy'        // General/Tournament
  | 'Target'        // Challenges
  | 'Medal'         // Achievements
  | 'ShoppingCart'  // Shop
  | 'Settings'      // Settings
  | 'User'          // Profile
  | 'Home';         // Home

export interface Game {
  id: string;
  name: string;
  description: string;
  icon: GameIcon;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  path: string;
  highScore?: number;
  lastPlayed?: Date;
}

export interface GameScore {
  gameId: string;
  userId: string;
  score: number;
  timestamp: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string;
  photoURL?: string;
  score: number;
  timestamp: Date;
}

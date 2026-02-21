export interface Game {
  id: string;
  name: string;
  description: string;
  emoji: string;
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
  score: number;
  timestamp: Date;
}

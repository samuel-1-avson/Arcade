'use client';

import { 
  Gamepad2, 
  Ghost, 
  Grid3x3, 
  Square, 
  Sparkles, 
  Bomb, 
  Calculator, 
  Circle,
  Trophy,
  Target,
  Medal,
  ShoppingCart,
  Settings,
  User,
  Home,
  LucideIcon
} from 'lucide-react';
import { GameIcon as GameIconType } from '@/types/game';
import { cn } from '@/lib/utils';

const iconMap: Record<GameIconType, LucideIcon> = {
  Gamepad2,
  Ghost,
  Grid3x3,
  Square,
  Sparkles,
  Bomb,
  Calculator,
  Circle,
  Trophy,
  Target,
  Medal,
  ShoppingCart,
  Settings,
  User,
  Home,
};

interface GameIconProps {
  icon: GameIconType;
  className?: string;
  size?: number;
}

export function GameIcon({ icon, className, size = 24 }: GameIconProps) {
  const IconComponent = iconMap[icon];
  
  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found, using default`);
    return <Gamepad2 className={className} size={size} />;
  }
  
  return <IconComponent className={cn(className)} size={size} />;
}

// Helper to get icon for a game by ID
export function getGameIcon(gameId: string): GameIconType {
  const iconMap: Record<string, GameIconType> = {
    snake: 'Gamepad2',
    pacman: 'Ghost',
    tetris: 'Grid3x3',
    breakout: 'Square',
    asteroids: 'Sparkles',
    minesweeper: 'Bomb',
    '2048': 'Calculator',
    tictactoe: 'Circle',
  };
  
  return iconMap[gameId] || 'Gamepad2';
}

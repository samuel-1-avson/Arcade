'use client';

import { Award, Lock, Star, Trophy, Zap, Target, Flame, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-game',
    name: 'First Steps',
    description: 'Play your first game',
    icon: GamepadIcon,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'common',
  },
  {
    id: 'score-1000',
    name: 'Score Hunter',
    description: 'Score 1,000 points in any game',
    icon: Trophy,
    unlocked: false,
    progress: 0,
    maxProgress: 1000,
    rarity: 'common',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Play for 7 days in a row',
    icon: Flame,
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    rarity: 'rare',
  },
  {
    id: 'all-games',
    name: 'Explorer',
    description: 'Play every game in the hub',
    icon: Target,
    unlocked: false,
    progress: 0,
    maxProgress: 8,
    rarity: 'rare',
  },
  {
    id: 'top-10',
    name: 'Top 10',
    description: 'Reach top 10 on any leaderboard',
    icon: Star,
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'epic',
  },
  {
    id: 'master',
    name: 'Arcade Master',
    description: 'Unlock all other achievements',
    icon: Crown,
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    rarity: 'legendary',
  },
];

function GamepadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M15 10v4M13 12h4" />
    </svg>
  );
}

const rarityStyles = {
  common: 'border-white/[0.08] bg-elevated',
  rare: 'border-accent-border bg-accent-dim',
  epic: 'border-violet/30 bg-violet/10',
  legendary: 'border-warning/30 bg-warning/10',
};

const rarityText = {
  common: 'text-muted-foreground',
  rare: 'text-accent',
  epic: 'text-violet',
  legendary: 'text-warning',
};

export default function AchievementsPage() {
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Achievements
          </h1>
          <p className="text-muted-foreground text-sm">
            Unlock badges by playing games
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-accent">
            {unlockedCount}/{totalCount}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Unlocked
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-elevated border border-white/[0.06] p-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2 bg-surface overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercent = (achievement.progress / achievement.maxProgress) * 100;

          return (
            <div
              key={achievement.id}
              className={cn(
                'relative border p-4 transition-all',
                achievement.unlocked ? rarityStyles[achievement.rarity] : 'border-white/[0.06] bg-elevated opacity-60'
              )}
            >
              {/* Locked overlay */}
              {!achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 flex items-center justify-center border',
                  achievement.unlocked ? 'border-current' : 'border-white/[0.08]'
                )}>
                  <Icon className={cn(
                    'w-6 h-6',
                    achievement.unlocked ? rarityText[achievement.rarity] : 'text-muted-foreground'
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wide text-primary">
                      {achievement.name}
                    </h3>
                    <span className={cn('text-[10px] uppercase tracking-wider', rarityText[achievement.rarity])}>
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {achievement.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                      <span className={achievement.unlocked ? 'text-accent' : 'text-muted-foreground'}>
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="h-1 bg-surface overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-500',
                          achievement.unlocked ? 'bg-accent' : 'bg-white/20'
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

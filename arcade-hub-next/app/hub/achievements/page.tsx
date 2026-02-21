'use client';

import { useEffect, useState } from 'react';
import { Award, Lock, Trophy, Target, Crown, Gamepad2, Star, Zap, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { achievementsService, Achievement, UserAchievement } from '@/lib/firebase/services/achievements';

const iconMap: Record<string, React.ElementType> = {
  Gamepad2,
  Trophy,
  Target,
  Crown,
  Star,
  Zap,
  Medal,
};

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
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<(Achievement & UserAchievement)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      setIsLoading(true);
      try {
        // Get all achievements
        const allAchievements = await achievementsService.getAllAchievements();
        
        // Get user's progress
        const userAchievements = user 
          ? await achievementsService.getUserAchievements(user.id)
          : [];

        // Merge achievement data with user progress
        const merged = allAchievements.map(achievement => {
          const userProgress = userAchievements.find(
            ua => ua.achievementId === achievement.id
          );
          return {
            ...achievement,
            achievementId: achievement.id,
            progress: userProgress?.progress || 0,
            unlocked: userProgress?.unlocked || false,
            unlockedAt: userProgress?.unlockedAt,
          };
        });

        setAchievements(merged as (Achievement & UserAchievement)[]);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, [user]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary">
            Achievements
          </h1>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          Loading achievements...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Achievements
          </h1>
          <p className="text-muted-foreground text-sm">
            {user ? 'Unlock badges by playing games' : 'Sign in to track your progress'}
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
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 bg-surface overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => {
          const Icon = iconMap[achievement.icon] || Trophy;
          const progressPercent = Math.min(100, (achievement.progress / achievement.maxProgress) * 100);

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

              {/* Unlocked indicator */}
              {achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <Award className="w-4 h-4 text-accent" />
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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

                  {/* Rewards */}
                  {achievement.unlocked && (
                    <div className="flex gap-3 mb-3 text-xs">
                      <span className="text-accent">+{achievement.xpReward} XP</span>
                      <span className="text-yellow-400">+{achievement.coinReward} Coins</span>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {achievement.progress.toLocaleString()}/{achievement.maxProgress.toLocaleString()}
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

'use client';

import { useEffect, useState } from 'react';
import { Target, Clock, Zap, Trophy, CheckCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { challengesService, Challenge, UserChallenge } from '@/lib/firebase/services/challenges';
import { userStatsService } from '@/lib/firebase/services/user-stats';

const iconMap: Record<string, React.ElementType> = {
  Target,
  Clock,
  Zap,
  Trophy,
};

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<(Challenge & UserChallenge)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenges = async () => {
      setIsLoading(true);
      try {
        // Get active challenges
        const activeChallenges = await challengesService.getActiveChallenges();
        
        // Get user's progress
        const userChallenges = user 
          ? await challengesService.getUserChallenges(user.id)
          : [];

        // Merge challenge data with user progress
        const merged = activeChallenges.map(challenge => {
          const userProgress = userChallenges.find(
            uc => uc.challengeId === challenge.id
          );
          return {
            ...challenge,
            challengeId: challenge.id,
            progress: userProgress?.progress || 0,
            completed: userProgress?.completed || false,
            completedAt: userProgress?.completedAt,
            claimed: userProgress?.claimed || false,
          };
        });

        setChallenges(merged as (Challenge & UserChallenge)[]);
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChallenges();
  }, [user]);

  const handleClaimReward = async (challengeId: string) => {
    if (!user) return;
    
    setClaiming(challengeId);
    try {
      const success = await challengesService.claimReward(user.id, challengeId);
      if (success) {
        // Update local state
        setChallenges(prev => prev.map(c => 
          c.id === challengeId ? { ...c, claimed: true } : c
        ));
        
        // Get challenge reward amount
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge) {
          await userStatsService.addCoins(user.id, challenge.reward);
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setClaiming(null);
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const claimedCount = challenges.filter(c => c.claimed).length;
  
  // Calculate time until next reset (midnight)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursLeft = Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesLeft = Math.floor(((tomorrow.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary">
          Daily Challenges
        </h1>
        <div className="p-8 text-center text-muted-foreground">
          Loading challenges...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
          Daily Challenges
        </h1>
        <p className="text-muted-foreground text-sm">
          {user ? 'Complete challenges to earn bonus coins' : 'Sign in to participate in challenges'}
        </p>
      </div>

      {/* Time Remaining */}
      <div className="bg-elevated border border-accent-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Time Remaining</p>
          <p className="font-display text-xl font-bold text-accent">
            {hoursLeft}h {minutesLeft}m
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
          <p className="font-display text-xl font-bold text-primary">
            {completedCount}/{challenges.length}
          </p>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {challenges.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-elevated border border-white/[0.06]">
            No active challenges available.
          </div>
        ) : (
          challenges.map((challenge) => {
            const Icon = iconMap[challenge.game === 'snake' ? 'Target' : 
                                 challenge.game === 'pacman' ? 'Zap' :
                                 challenge.game === 'tetris' ? 'Clock' : 'Trophy'] || Target;
            const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100);
            const canClaim = challenge.completed && !challenge.claimed;

            return (
              <div
                key={challenge.id}
                className={cn(
                  "bg-elevated border p-4 transition-colors",
                  canClaim ? "border-warning/50 bg-warning/5" : "border-white/[0.06] hover:border-white/[0.12]"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 border flex items-center justify-center flex-shrink-0",
                    challenge.completed ? "bg-accent-dim border-accent-border" : "bg-surface border-white/[0.08]"
                  )}>
                    {challenge.claimed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Icon className={cn(
                        "w-6 h-6",
                        challenge.completed ? "text-accent" : "text-muted-foreground"
                      )} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-primary">
                          {challenge.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-warning">+{challenge.reward}</p>
                        <p className="text-[10px] text-muted-foreground">coins</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {challenge.progress.toLocaleString()}/{challenge.target.toLocaleString()}
                        </span>
                        <span className={challenge.completed ? 'text-accent' : 'text-muted-foreground'}>
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="h-2 bg-surface overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            challenge.completed ? "bg-accent" : "bg-white/20"
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Claim Button */}
                    {canClaim && user && (
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleClaimReward(challenge.id)}
                        disabled={claiming === challenge.id}
                      >
                        {claiming === challenge.id ? 'Claiming...' : 'Claim Reward'}
                      </Button>
                    )}

                    {/* Claimed Status */}
                    {challenge.claimed && (
                      <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Reward claimed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Weekly Challenges Teaser */}
      <div className="bg-elevated border border-white/[0.06] p-6 text-center">
        <p className="text-muted-foreground text-sm mb-2">Weekly Challenges</p>
        <p className="text-xs text-muted-foreground">
          Complete daily challenges to unlock weekly challenges with bigger rewards!
        </p>
      </div>
    </div>
  );
}

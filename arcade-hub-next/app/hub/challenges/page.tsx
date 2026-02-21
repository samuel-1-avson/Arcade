'use client';

import { Target, Clock, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  reward: number;
  progress: number;
  maxProgress: number;
  timeLeft: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'daily-score',
    title: 'Daily Score Hunter',
    description: 'Score 5,000 points in any game today',
    icon: Target,
    reward: 100,
    progress: 0,
    maxProgress: 5000,
    timeLeft: '12h 30m',
  },
  {
    id: 'speed-runner',
    title: 'Speed Runner',
    description: 'Complete a game in under 2 minutes',
    icon: Zap,
    reward: 150,
    progress: 0,
    maxProgress: 1,
    timeLeft: '12h 30m',
  },
  {
    id: 'marathon',
    title: 'Marathon Player',
    description: 'Play 10 games today',
    icon: Clock,
    reward: 200,
    progress: 0,
    maxProgress: 10,
    timeLeft: '12h 30m',
  },
  {
    id: 'high-scorer',
    title: 'High Scorer',
    description: 'Beat your high score in any game',
    icon: Trophy,
    reward: 300,
    progress: 0,
    maxProgress: 1,
    timeLeft: '12h 30m',
  },
];

export default function ChallengesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
          Daily Challenges
        </h1>
        <p className="text-muted-foreground text-sm">
          Complete challenges to earn bonus coins
        </p>
      </div>

      {/* Time Remaining */}
      <div className="bg-elevated border border-accent-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Time Remaining</p>
          <p className="font-display text-xl font-bold text-accent">12h 30m</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
          <p className="font-display text-xl font-bold text-primary">0/4</p>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {CHALLENGES.map((challenge) => {
          const Icon = challenge.icon;
          const progressPercent = (challenge.progress / challenge.maxProgress) * 100;

          return (
            <div
              key={challenge.id}
              className="bg-elevated border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-accent" />
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
                        {challenge.progress}/{challenge.maxProgress}
                      </span>
                      <span className="text-accent">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-surface overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Time Left */}
                  <p className="text-xs text-muted-foreground mt-2">
                    Resets in {challenge.timeLeft}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
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

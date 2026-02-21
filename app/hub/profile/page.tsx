'use client';

import { useEffect, useState } from 'react';
import { User, Edit2, Trophy, Gamepad2, Clock, Award, LogIn, Ghost, Grid3x3, Target, Circle, Bot, Sparkles, Coins, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { userStatsService, UserStats } from '@/lib/firebase/services/user-stats';
import { achievementsService } from '@/lib/firebase/services/achievements';

// Avatar icons for selection
const AVATAR_ICONS = [
  { name: 'User', Icon: User },
  { name: 'Ghost', Icon: Ghost },
  { name: 'Gamepad2', Icon: Gamepad2 },
  { name: 'Grid3x3', Icon: Grid3x3 },
  { name: 'Target', Icon: Target },
  { name: 'Circle', Icon: Circle },
  { name: 'Bot', Icon: Bot },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Trophy', Icon: Trophy },
  { name: 'Award', Icon: Award },
];

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, signInWithGoogle, signInAsGuest, updateProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'User');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) {
        setStatsLoading(false);
        return;
      }

      setStatsLoading(true);
      try {
        // Load user stats
        const stats = await userStatsService.getUserStats(user.id);
        setUserStats(stats);

        // Load achievements count
        const achievements = await achievementsService.getUserAchievements(user.id);
        setAchievementsCount(achievements.filter(a => a.unlocked).length);
      } catch (error) {
        // Error loading user stats - handled by UI
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, [user?.id]);

  const handleSave = async () => {
    await updateProfile(editName);
    setIsEditModalOpen(false);
  };

  // Get the icon component for the selected avatar
  const getAvatarIcon = (avatarName: string) => {
    const avatar = AVATAR_ICONS.find(a => a.name === avatarName);
    return avatar?.Icon || User;
  };

  const SelectedAvatarIcon = getAvatarIcon(selectedAvatar);
  const CurrentAvatarIcon = getAvatarIcon(user?.avatar || 'User');

  // Calculate XP for next level
  const currentLevel = userStats?.level || 1;
  const currentXp = userStats?.xp || 0;
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = Math.min(100, (currentXp / xpForNextLevel) * 100);

  // Format play time
  const formatPlayTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Show sign-in prompt if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to view and manage your profile
          </p>
        </div>

        <div className="bg-elevated border border-white/[0.06] p-8 text-center">
          <div className="w-20 h-20 bg-surface border-2 border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-bold text-primary mb-2">
            Not Signed In
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in with Google to save your progress and track your stats
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={signInWithGoogle} className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </Button>
            <Button variant="secondary" onClick={signInAsGuest}>
              Play as Guest
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          View and manage your profile
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-elevated border border-white/[0.06] p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-surface border-2 border-accent flex items-center justify-center overflow-hidden">
              {user?.avatar?.startsWith('http') || user?.avatar?.startsWith('//') ? (
                <img 
                  src={user.avatar} 
                  alt={user.displayName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <CurrentAvatarIcon className="w-10 h-10 text-primary" />
              )}
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-elevated border border-white/[0.08] flex items-center justify-center hover:border-accent transition-colors"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-primary">
              {user?.displayName || 'Guest Player'}
            </h2>
            <p className="text-muted-foreground text-sm">{user?.email || 'guest@arcade.gg'}</p>

            {/* Level Badge */}
            <div className="mt-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-accent-dim border border-accent-border text-accent text-xs font-bold uppercase">
                Level {currentLevel}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentXp} / {xpForNextLevel} XP
              </span>
            </div>

            {/* XP Bar */}
            <div className="mt-2 h-1.5 bg-surface overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coins Card */}
      <div className="bg-elevated border border-warning/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-warning/10 border border-warning/30 flex items-center justify-center">
            <Coins className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Coin Balance</p>
            <p className="font-mono text-2xl font-bold text-warning">
              {statsLoading ? '...' : (userStats?.coins || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <a href="/hub/shop">
          <Button size="sm" variant="secondary">
            Visit Shop
          </Button>
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Total Score"
          value={statsLoading ? '...' : (userStats?.totalScore || 0).toLocaleString()}
        />
        <StatCard
          icon={Gamepad2}
          label="Games Played"
          value={statsLoading ? '...' : (userStats?.gamesPlayed || 0).toString()}
        />
        <StatCard
          icon={Clock}
          label="Play Time"
          value={statsLoading ? '...' : formatPlayTime(userStats?.totalPlayTime || 0)}
        />
        <StatCard
          icon={Award}
          label="Achievements"
          value={statsLoading ? '...' : achievementsCount.toString()}
        />
      </div>

      {/* Recent Activity */}
      <section className="bg-elevated border border-white/[0.06]">
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">No recent activity</p>
          <p className="text-xs mt-1">Play some games to see your history!</p>
        </div>
      </section>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={20}
          />

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_ICONS.map(({ name, Icon }) => (
                <button
                  key={name}
                  onClick={() => setSelectedAvatar(name)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center border transition-colors',
                    selectedAvatar === name
                      ? 'border-accent bg-accent-dim'
                      : 'border-white/[0.08] bg-surface hover:border-white/[0.12]'
                  )}
                >
                  <Icon className="w-5 h-5 text-primary" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-elevated border border-white/[0.06] p-4 text-center">
      <Icon className="w-5 h-5 text-accent mx-auto mb-2" />
      <p className="font-mono text-xl font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

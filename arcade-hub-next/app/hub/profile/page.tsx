'use client';

import { useState } from 'react';
import { User, Edit2, Trophy, Gamepad2, Clock, Award, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';

const AVATARS = ['🎮', '👾', '🕹️', '🎯', '🎲', '🤖', '👽', '🥷', '🤠', '🎸'];

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, signInWithGoogle, signInAsGuest, updateProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🎮');

  const handleSave = async () => {
    await updateProfile(editName);
    setIsEditModalOpen(false);
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
          <div className="w-20 h-20 bg-surface border-2 border-white/[0.08] flex items-center justify-center text-4xl mx-auto mb-4">
            👤
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
            <div className="w-20 h-20 bg-surface border-2 border-accent flex items-center justify-center text-4xl">
              {user?.avatar || '🎮'}
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
                Level {user?.level || 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.xp || 0} / 100 XP
              </span>
            </div>

            {/* XP Bar */}
            <div className="mt-2 h-1.5 bg-surface overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${(user?.xp || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Total Score"
          value={(user?.totalScore || 0).toLocaleString()}
        />
        <StatCard
          icon={Gamepad2}
          label="Games Played"
          value={(user?.gamesPlayed || 0).toString()}
        />
        <StatCard
          icon={Clock}
          label="Play Time"
          value="0h"
        />
        <StatCard
          icon={Award}
          label="Achievements"
          value="0"
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
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={cn(
                    'w-10 h-10 text-xl flex items-center justify-center border transition-colors',
                    selectedAvatar === avatar
                      ? 'border-accent bg-accent-dim'
                      : 'border-white/[0.08] bg-surface hover:border-white/[0.12]'
                  )}
                >
                  {avatar}
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

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="bg-elevated border border-white/[0.06] p-4 text-center">
      <Icon className="w-5 h-5 text-accent mx-auto mb-2" />
      <p className="font-mono text-xl font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

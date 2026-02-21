'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Trophy, 
  Gamepad2, 
  Target, 
  Clock, 
  Crown,
  Circle,
  Loader2,
  UserX,
  MessageSquare,
  Users
} from 'lucide-react';
import { publicProfilesService, PublicProfile } from '@/lib/firebase/services/public-profiles';
import { friendsService } from '@/lib/firebase/services/friends';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const currentUser = useAuthStore((state) => state.user);
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friend' | 'pending_sent' | 'pending_received'>('none');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (currentUser && !isOwnProfile) {
      checkFriendStatus();
    }
  }, [currentUser, userId, isOwnProfile]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profileData = await publicProfilesService.getPublicProfile(userId);
      if (profileData) {
        setProfile(profileData);
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFriendStatus = async () => {
    if (!currentUser) return;
    
    try {
      const friends = await friendsService.getFriends(currentUser.id);
      const isFriend = friends.some(f => f.userId === userId);
      
      if (isFriend) {
        setFriendStatus('friend');
        return;
      }
      
      const requests = await friendsService.getFriendRequests(currentUser.id);
      const sentRequest = requests.sent.some(r => r.toUserId === userId);
      const receivedRequest = requests.received.some(r => r.fromUserId === userId);
      
      if (sentRequest) {
        setFriendStatus('pending_sent');
      } else if (receivedRequest) {
        setFriendStatus('pending_received');
      } else {
        setFriendStatus('none');
      }
    } catch (err) {
      console.error('Failed to check friend status:', err);
    }
  };

  const handleAddFriend = async () => {
    if (!currentUser || !profile) return;
    
    setIsAddingFriend(true);
    try {
      await friendsService.sendFriendRequest(currentUser.id, userId);
      setFriendStatus('pending_sent');
    } catch (err) {
      console.error('Failed to send friend request:', err);
    } finally {
      setIsAddingFriend(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <UserX className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-primary">Profile Not Found</h1>
        <p className="text-muted-foreground">The user profile you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-elevated border border-white/[0.06] p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center text-3xl font-bold text-accent border-4 border-background">
              {profile.photoURL ? (
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <span className={cn(
              'absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-background',
              profile.isOnline ? 'bg-green-500' : 'bg-gray-500'
            )} />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-primary">{profile.displayName}</h1>
              {profile.title && (
                <span 
                  className="px-2 py-0.5 text-xs border rounded-full"
                  style={{ borderColor: profile.titleColor, color: profile.titleColor }}
                >
                  {profile.title}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-yellow-400" />
                Level {profile.level}
              </span>
              <span className="flex items-center gap-1.5">
                <Circle className={cn('w-3 h-3 fill-current', profile.isOnline ? 'text-green-500' : 'text-gray-500')} />
                {profile.isOnline ? 'Online' : `Last seen ${formatLastSeen(profile.lastSeen)}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Joined {formatDate(profile.joinedAt)}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          {!isOwnProfile && currentUser && (
            <div className="flex gap-2">
              {friendStatus === 'none' && (
                <Button onClick={handleAddFriend} disabled={isAddingFriend}>
                  {isAddingFriend ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  Add Friend
                </Button>
              )}
              {friendStatus === 'pending_sent' && (
                <Button variant="secondary" disabled>
                  Request Sent
                </Button>
              )}
              {friendStatus === 'pending_received' && (
                <Button variant="secondary">
                  Respond to Request
                </Button>
              )}
              {friendStatus === 'friend' && (
                <Button variant="outline" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Friends
                </Button>
              )}
              <Button variant="outline" size="icon">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {isOwnProfile && (
            <Button variant="outline" disabled>
              Your Profile
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          label="Total Score"
          value={profile.totalScore.toLocaleString()}
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-accent" />}
          label="Achievements"
          value={profile.totalAchievements.toString()}
        />
        <StatCard
          icon={<Gamepad2 className="w-5 h-5 text-green-400" />}
          label="Games Played"
          value={profile.gamesPlayed.toString()}
        />
        <StatCard
          icon={<Crown className="w-5 h-5 text-purple-400" />}
          label="Current Level"
          value={profile.level.toString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Achievements */}
        <div className="lg:col-span-2 bg-elevated border border-white/[0.06] p-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Recent Achievements
          </h2>
          
          {profile.recentAchievements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No achievements unlocked yet
            </p>
          ) : (
            <div className="space-y-3">
              {profile.recentAchievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                >
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center text-xl">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-primary">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Unlocked {formatDate(achievement.unlockedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Game */}
        <div className="bg-elevated border border-white/[0.06] p-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-green-400" />
            Favorite Game
          </h2>
          
          {profile.favoriteGame ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-10 h-10 text-accent" />
              </div>
              <p className="font-medium text-primary capitalize">{profile.favoriteGame}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No favorite game set
            </p>
          )}
          
          <div className="w-full h-px bg-white/10 my-4" />
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member for</span>
              <span className="text-primary">{getDaysSince(profile.joinedAt)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last active</span>
              <span className="text-primary">{formatLastSeen(profile.lastSeen)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-elevated border border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

function getDaysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / 86400000);
}

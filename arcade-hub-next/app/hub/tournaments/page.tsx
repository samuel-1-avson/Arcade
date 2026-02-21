'use client';

import { useEffect, useState } from 'react';
import { Trophy, Users, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { tournamentsService, Tournament } from '@/lib/firebase/services/tournaments';
import { cn } from '@/lib/utils';

type TabType = 'upcoming' | 'active' | 'ended';

export default function TournamentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const loadTournaments = async () => {
      setIsLoading(true);
      try {
        let data: Tournament[] = [];
        
        switch (activeTab) {
          case 'upcoming':
            data = await tournamentsService.getUpcomingTournaments();
            break;
          case 'active':
            data = await tournamentsService.getActiveTournaments();
            break;
          case 'ended':
            data = await tournamentsService.getEndedTournaments();
            break;
        }
        
        setTournaments(data);

        // Check which tournaments user has joined
        if (user) {
          const joined = new Set<string>();
          for (const tournament of data) {
            const isJoined = await tournamentsService.isParticipant(user.id, tournament.id);
            if (isJoined) joined.add(tournament.id);
          }
          setJoinedTournaments(joined);
        }
      } catch (error) {
        // Error loading tournaments - handled by UI
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, [activeTab, user]);

  const handleJoin = async (tournament: Tournament) => {
    if (!user) return;

    setJoining(tournament.id);
    try {
      const success = await tournamentsService.joinTournament(
        user.id,
        tournament.id,
        user.displayName || 'Anonymous',
        user.avatar?.startsWith('http') ? user.avatar : undefined
      );
      
      if (success) {
        setJoinedTournaments(prev => new Set(Array.from(prev).concat(tournament.id)));
        // Update participant count locally
        setTournaments(prev => prev.map(t => 
          t.id === tournament.id 
            ? { ...t, participants: t.participants + 1 }
            : t
        ));
      }
    } catch (error) {
      // Error joining tournament - handled by UI
    } finally {
      setJoining(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'active', label: 'Active' },
    { id: 'ended', label: 'Past' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary">
          Tournaments
        </h1>
        <div className="p-8 text-center text-muted-foreground">
          Loading tournaments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Tournaments
          </h1>
          <p className="text-muted-foreground text-sm">
            {user ? 'Compete in tournaments for big prizes' : 'Sign in to join tournaments'}
          </p>
        </div>
        <Button disabled={!user}>
          Create Tournament
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors',
              activeTab === tab.id
                ? 'bg-elevated border border-accent-border text-accent'
                : 'bg-transparent border border-transparent text-muted-foreground hover:text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tournament List */}
      <div className="space-y-4">
        {tournaments.length > 0 ? (
          tournaments.map((tournament) => {
            const isJoined = joinedTournaments.has(tournament.id);
            const isFull = tournament.participants >= tournament.maxParticipants;

            return (
              <div
                key={tournament.id}
                className="bg-elevated border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-primary">
                      {tournament.name}
                    </h3>
                    <p className="text-sm text-accent">{tournament.game}</p>
                    
                    {tournament.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {tournament.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {tournament.participants}/{tournament.maxParticipants} players
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tournament.startTime)}
                      </span>
                      {tournament.status === 'ended' && tournament.winner && (
                        <span className="flex items-center gap-1 text-success">
                          <Trophy className="w-3 h-3" />
                          Winner: {tournament.winner}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-warning justify-end">
                      <Trophy className="w-4 h-4" />
                      <span className="font-mono font-bold">{tournament.prize}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">coins</p>
                    
                    {tournament.status === 'upcoming' && (
                      isJoined ? (
                        <div className="flex items-center gap-1 text-success text-xs mt-2 justify-end">
                          <CheckCircle className="w-3 h-3" />
                          <span>Joined</span>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          disabled={!user || isFull || joining === tournament.id}
                          onClick={() => handleJoin(tournament)}
                        >
                          {joining === tournament.id ? '...' : isFull ? 'Full' : 'Join'}
                        </Button>
                      )
                    )}
                    
                    {tournament.status === 'active' && (
                      <Button size="sm" className="mt-2" variant="primary">
                        Play
                      </Button>
                    )}
                    
                    {tournament.status === 'ended' && (
                      <span className="text-xs text-muted-foreground mt-2 block">
                        Ended
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-elevated border border-white/[0.06] p-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-primary mb-2">
              No {activeTab} Tournaments
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {activeTab === 'upcoming' 
                ? 'Create a tournament to play with friends'
                : activeTab === 'active'
                  ? 'No tournaments are currently active'
                  : 'No past tournaments to display'}
            </p>
            {activeTab === 'upcoming' && (
              <Button disabled={!user}>
                Create Tournament
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

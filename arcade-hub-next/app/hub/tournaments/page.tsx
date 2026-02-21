'use client';

import { useEffect, useState } from 'react';
import { Trophy, Users, Calendar, CheckCircle, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { tournamentsService, Tournament } from '@/lib/firebase/services/tournaments';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type TabType = 'upcoming' | 'active' | 'ended';

const GAMES = [
  { id: 'snake', name: 'Snake' },
  { id: 'tetris', name: 'Tetris' },
  { id: 'breakout', name: 'Breakout' },
  { id: 'asteroids', name: 'Asteroids' },
  { id: '2048', name: '2048' },
  { id: 'minesweeper', name: 'Minesweeper' },
  { id: 'pacman', name: 'Pac-Man' },
  { id: 'rhythm', name: 'Rhythm' },
  { id: 'roguelike', name: 'Roguelike' },
  { id: 'toonshooter', name: 'Toon Shooter' },
  { id: 'tower-defense', name: 'Tower Defense' },
];

export default function TournamentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [joinedTournaments, setJoinedTournaments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  
  // Create tournament dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTournament, setNewTournament] = useState({
    name: '',
    game: GAMES[0].id,
    description: '',
    maxParticipants: 8,
    prize: 100,
    startTime: '',
  });

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

  const handleCreateTournament = async () => {
    if (!user) return;
    
    // Validate inputs
    if (!newTournament.name.trim()) {
      setCreateError('Tournament name is required');
      return;
    }
    if (!newTournament.startTime) {
      setCreateError('Start time is required');
      return;
    }
    if (newTournament.maxParticipants < 2 || newTournament.maxParticipants > 100) {
      setCreateError('Max participants must be between 2 and 100');
      return;
    }
    if (newTournament.prize < 0) {
      setCreateError('Prize cannot be negative');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    
    try {
      const tournamentId = await tournamentsService.createTournament(
        user.id,
        {
          name: newTournament.name.trim(),
          game: newTournament.game,
          description: newTournament.description.trim(),
          maxParticipants: newTournament.maxParticipants,
          prize: newTournament.prize,
          startTime: new Date(newTournament.startTime),
        }
      );
      
      if (tournamentId) {
        // Reset form and close dialog
        setNewTournament({
          name: '',
          game: GAMES[0].id,
          description: '',
          maxParticipants: 8,
          prize: 100,
          startTime: '',
        });
        setIsCreateDialogOpen(false);
        
        // Refresh tournaments list
        const data = await tournamentsService.getUpcomingTournaments();
        setTournaments(data);
        setActiveTab('upcoming');
      } else {
        setCreateError('Failed to create tournament. Please try again.');
      }
    } catch (error) {
      setCreateError('An error occurred while creating the tournament');
    } finally {
      setIsCreating(false);
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
        <Button 
          disabled={!user}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
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
              <Button 
                disabled={!user}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Tournament Dialog */}
      {isCreateDialogOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => !isCreating && setIsCreateDialogOpen(false)}
          />
          
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
                <h2 className="font-display text-lg font-bold uppercase tracking-wider text-primary">
                  Create Tournament
                </h2>
                <button
                  onClick={() => !isCreating && setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-white/5 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Form */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Tournament Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Tournament Name *
                    </label>
                    <Input
                      placeholder="e.g., Weekend Snake Championship"
                      value={newTournament.name}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isCreating}
                    />
                  </div>
                  
                  {/* Game Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Game *
                    </label>
                    <select
                      value={newTournament.game}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, game: e.target.value }))}
                      disabled={isCreating}
                      className="w-full h-10 px-3 bg-transparent border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {GAMES.map(game => (
                        <option key={game.id} value={game.id}>{game.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe your tournament..."
                      value={newTournament.description}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, description: e.target.value }))}
                      disabled={isCreating}
                      rows={3}
                      className="w-full px-3 py-2 bg-transparent border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                  
                  {/* Max Participants */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Max Participants *
                    </label>
                    <Input
                      type="number"
                      min={2}
                      max={100}
                      value={newTournament.maxParticipants}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 8 }))}
                      disabled={isCreating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 2, maximum 100 players
                    </p>
                  </div>
                  
                  {/* Prize */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Prize (coins) *
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={newTournament.prize}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, prize: parseInt(e.target.value) || 0 }))}
                      disabled={isCreating}
                    />
                  </div>
                  
                  {/* Start Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">
                      Start Time *
                    </label>
                    <Input
                      type="datetime-local"
                      value={newTournament.startTime}
                      onChange={(e) => setNewTournament(prev => ({ ...prev, startTime: e.target.value }))}
                      disabled={isCreating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tournament will start automatically at this time
                    </p>
                  </div>
                  
                  {/* Error Message */}
                  {createError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">{createError}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Footer */}
              <div className="flex justify-end gap-3 p-4 border-t border-white/[0.05]">
                <Button
                  variant="ghost"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTournament}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Create Tournament
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

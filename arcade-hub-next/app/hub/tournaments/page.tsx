'use client';

import { Trophy, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Tournament {
  id: string;
  name: string;
  game: string;
  participants: number;
  maxParticipants: number;
  startTime: string;
  prize: number;
  status: 'upcoming' | 'active' | 'ended';
}

const TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'Pac-Man Championship',
    game: 'Pac-Man',
    participants: 16,
    maxParticipants: 32,
    startTime: '2024-03-01 20:00',
    prize: 1000,
    status: 'upcoming',
  },
  {
    id: '2',
    name: 'Snake Speedrun',
    game: 'Snake',
    participants: 8,
    maxParticipants: 16,
    startTime: '2024-02-28 18:00',
    prize: 500,
    status: 'upcoming',
  },
];

export default function TournamentsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Tournaments
          </h1>
          <p className="text-muted-foreground text-sm">
            Compete in tournaments for big prizes
          </p>
        </div>
        <Button>Create Tournament</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['Upcoming', 'Active', 'Past'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wider bg-elevated border border-accent-border text-accent"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tournament List */}
      <div className="space-y-4">
        {TOURNAMENTS.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-elevated border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-primary">
                  {tournament.name}
                </h3>
                <p className="text-sm text-accent">{tournament.game}</p>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {tournament.participants}/{tournament.maxParticipants}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {tournament.startTime}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-warning">
                  <Trophy className="w-4 h-4" />
                  <span className="font-mono font-bold">{tournament.prize}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">coins</p>
                <Button size="sm" className="mt-2">Join</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {TOURNAMENTS.length === 0 && (
        <div className="bg-elevated border border-white/[0.06] p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-primary mb-2">
            No Tournaments
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create a tournament to play with friends
          </p>
          <Button>Create Tournament</Button>
        </div>
      )}
    </div>
  );
}

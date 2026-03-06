'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Trophy, Users } from 'lucide-react';

// Hardcoded game definition - inline to avoid any import issues
const GAME = {
  id: 'neon-snake',
  name: 'Neon Snake Arena',
  description: 'A modern cyberpunk twist on the classic Snake game with neon aesthetics, power-ups, and multiple game modes.',
  icon: 'Gamepad2',
  difficulty: 'easy' as const,
  category: 'Arcade',
  path: '/games/neon-snake/index.html',
};

export default function GamesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-[#00e5ff] mb-2">
            Game Library
          </h1>
          <p className="text-gray-400 text-sm">1 game available</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search games..."
            className="pl-9 bg-[#121212] border-gray-700"
          />
        </div>
      </div>

      {/* Single Game Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Link 
          href="/game/neon-snake/"
          className="group block"
        >
          <div className="relative bg-[#121212] border border-gray-800 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gray-600">
            {/* Art area */}
            <div className="relative h-32 bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />
              {/* Icon placeholder - Gamepad icon using SVG */}
              <svg 
                className="w-12 h-12 text-[#00e5ff] transition-transform duration-300 group-hover:scale-110" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <line x1="15" y1="13" x2="15.01" y2="13" />
                <line x1="18" y1="11" x2="18.01" y2="11" />
                <rect x="2" y="6" width="20" height="12" rx="2" />
              </svg>
              
              {/* Difficulty badge */}
              <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/70 border border-green-400/30 text-green-400">
                Easy
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-[#00e5ff] truncate group-hover:text-[#00b8cc] transition-colors">
                {GAME.name}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                {GAME.description}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span>—</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="w-3 h-3" />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Play button (appears on hover) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="block w-full py-2 bg-[#0a0a0a] border border-white/[0.08] text-[#00e5ff] text-xs font-display uppercase tracking-wider text-center hover:bg-[#00e5ff]/10 transition-colors">
                Play Now
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

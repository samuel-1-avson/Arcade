'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Game } from '@/types/game';

const FEATURED_GAMES: Game[] = [
  {
    id: 'pacman',
    name: 'Pac-Man',
    description: 'Navigate the maze, eat all the dots, and avoid the ghosts. The arcade classic that started it all.',
    emoji: '👾',
    difficulty: 'medium',
    category: 'arcade',
    path: '/games/pacman/',
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat food, grow longer, and avoid colliding with yourself in this timeless classic.',
    emoji: '🐍',
    difficulty: 'easy',
    category: 'classic',
    path: '/games/snake/',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack falling blocks to clear lines in the world\'s most addictive puzzle game.',
    emoji: '🧱',
    difficulty: 'medium',
    category: 'puzzle',
    path: '/games/tetris/',
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentGame = FEATURED_GAMES[currentIndex];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % FEATURED_GAMES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + FEATURED_GAMES.length) % FEATURED_GAMES.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-elevated border border-white/[0.06] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      
      <div className="flex flex-col lg:flex-row">
        {/* Content */}
        <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGame.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent mb-4">
                <span className="w-1 h-1 bg-accent animate-pulse" />
                Featured
              </span>
              
              <h2 className="font-display text-3xl lg:text-4xl font-bold uppercase tracking-wide text-primary mb-4">
                {currentGame.name}
              </h2>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className={`uppercase text-xs font-semibold ${
                  currentGame.difficulty === 'easy' ? 'text-success' :
                  currentGame.difficulty === 'medium' ? 'text-warning' : 'text-danger'
                }`}>
                  {currentGame.difficulty}
                </span>
                <span>•</span>
                <span>1 Player</span>
                <span>•</span>
                <span>Arcade Classic</span>
              </div>
              
              <p className="text-muted-foreground max-w-md mb-8">
                {currentGame.description}
              </p>
              
              <button
                className="inline-flex items-center gap-3 px-8 py-4 border border-accent-border text-accent font-display text-sm uppercase tracking-widest hover:bg-accent-dim hover:border-accent transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Play Now
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Art */}
        <div className="relative lg:w-[45%] min-h-[280px] bg-surface flex items-center justify-center">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentGame.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="relative text-[8rem] lg:text-[10rem] drop-shadow-[0_0_30px_rgba(0,229,255,0.2)]"
            >
              {currentGame.emoji}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={prevSlide}
              className="w-9 h-9 bg-elevated border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:border-accent-border hover:text-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="w-9 h-9 bg-elevated border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:border-accent-border hover:text-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {FEATURED_GAMES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 transition-all ${
                  idx === currentIndex 
                    ? 'w-5 bg-accent' 
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

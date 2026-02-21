'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Gamepad2, Trophy, Target, Award, ShoppingCart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGames } from '@/hooks/useGames';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { allGames } = useGames();

  // Static commands
  const staticCommands: CommandItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: Gamepad2,
      shortcut: 'H',
      action: () => { window.location.href = '/hub/'; onClose(); }
    },
    {
      id: 'leaderboard',
      label: 'View Leaderboard',
      icon: BarChart3,
      action: () => { window.location.href = '/hub/leaderboard/'; onClose(); }
    },
    {
      id: 'achievements',
      label: 'View Achievements',
      icon: Award,
      action: () => { window.location.href = '/hub/achievements/'; onClose(); }
    },
    {
      id: 'shop',
      label: 'Visit Shop',
      icon: ShoppingCart,
      action: () => { window.location.href = '/hub/shop/'; onClose(); }
    },
  ];

  // Game commands
  const gameCommands: CommandItem[] = useMemo(() => 
    allGames.map(game => ({
      id: `game-${game.id}`,
      label: `Play ${game.name}`,
      icon: Gamepad2,
      action: () => { window.location.href = `/game/${game.id}/`; onClose(); }
    })),
    [allGames, onClose]
  );

  // Filter commands
  const filteredCommands = useMemo(() => {
    const all = [...staticCommands, ...gameCommands];
    if (!query) return all;
    return all.filter(cmd => 
      cmd.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [staticCommands, gameCommands, query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close on backdrop click
  const handleBackdropClick = () => {
    onClose();
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
          />
          
          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-lg bg-elevated border border-white/[0.08] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-white/[0.05] p-4">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search games, commands..."
                    className="flex-1 bg-transparent border-none outline-none text-primary placeholder:text-muted-foreground"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                  <kbd className="px-2 py-1 bg-white/[0.06] text-[10px] text-muted-foreground font-mono">
                    ESC
                  </kbd>
                </div>
              </div>
              
              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No results found
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((cmd, idx) => (
                      <button
                        key={cmd.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                          idx === selectedIndex 
                            ? 'bg-accent/10 text-accent' 
                            : 'text-primary hover:bg-elevated/80'
                        )}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <cmd.icon className="w-4 h-4" />
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="px-2 py-0.5 bg-white/[0.06] text-[10px] text-muted-foreground font-mono">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="border-t border-white/[0.05] px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/[0.06] font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/[0.06] font-mono">↵</kbd>
                  Select
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

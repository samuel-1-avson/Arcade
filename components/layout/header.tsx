'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { CommandPalette } from '@/components/features/command-palette';
import { AuthModal } from '@/components/features/auth-modal';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUserClick = () => {
    if (isAuthenticated) {
      router.push('/hub/profile/');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-16 right-0 h-16 bg-surface border-b border-white/[0.05] z-40 flex items-center justify-between px-6">
        <h1 className="font-display text-lg font-bold uppercase tracking-wider text-primary">
          Game Hub
        </h1>
        
        <div className="flex items-center gap-4">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 bg-elevated border border-white/[0.08] text-muted-foreground text-sm',
              'hover:bg-elevated/80 hover:border-white/[0.12] hover:text-primary transition-colors'
            )}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white/[0.06] text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>

          {/* User Avatar */}
          <button
            onClick={handleUserClick}
            className="w-9 h-9 bg-elevated border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:bg-elevated/80 hover:text-primary transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

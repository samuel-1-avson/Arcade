'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useGames } from '@/hooks/useGames';
import { useAuthStore, useGameStore } from '@/lib/store';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameClientProps {
  gameId: string;
}

export function GameClient({ gameId }: GameClientProps) {
  const router = useRouter();
  const { allGames } = useGames();
  const { user } = useAuthStore();
  const { setHighScore } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  
  const game = allGames.find(g => g.id === gameId);

  // Listen for messages from the game iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      switch (event.data.type) {
        case 'GAME_SCORE':
          if (event.data.score) {
            setHighScore(gameId, event.data.score);
          }
          break;
        case 'GAME_EXIT':
          router.push('/hub/');
          break;
        case 'GAME_READY':
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [gameId, router, setHighScore]);

  const handleExit = useCallback(() => {
    router.push('/hub/');
  }, [router]);

  const handleFullscreen = useCallback(() => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.requestFullscreen();
    }
  }, []);

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-primary mb-4">Game Not Found</h1>
          <Button onClick={handleExit}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-surface/90 backdrop-blur border-b border-white/[0.05] flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleExit}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              {game.name}
            </h1>
            <p className="text-xs text-muted-foreground">Press ESC to exit</p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" onClick={handleFullscreen}>
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-display uppercase tracking-wider">
              Loading {game.name}...
            </p>
          </div>
        </div>
      )}

      {/* Game Iframe */}
      <iframe
        src={game.path}
        className="w-full h-full pt-14 border-0"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups"
        onLoad={() => {
          setIsLoading(false);
          // Send init message to game
          const iframe = document.querySelector('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'INIT_GAME',
              userId: user?.id || 'guest',
              username: user?.displayName || 'Guest',
            }, '*');
          }
        }}
      />
    </div>
  );
}

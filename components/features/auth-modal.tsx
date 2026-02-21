'use client';

import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInAsGuest, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setError(null);
      await signInAsGuest();
      onClose();
    } catch (err) {
      setError('Failed to sign in as guest. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} size="sm">
      <div className="text-center py-4">
        {/* Logo */}
        <div className="w-14 h-14 bg-elevated border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
          <Gamepad2 className="w-7 h-7 text-accent" />
        </div>
        
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-primary mb-2">
          Insert Coin
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in to save your progress and compete on leaderboards
        </p>

        {error && (
          <p className="text-sm text-danger mb-4 bg-danger/10 border border-danger/20 p-2">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {/* Google Sign In */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.05]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Guest Sign In */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleGuestSignIn}
            isLoading={isLoading}
          >
            Play as Guest
          </Button>
        </div>
      </div>

      <ModalFooter>
        <p className="text-xs text-muted-foreground text-center w-full">
          By signing in, you agree to our Terms and Privacy Policy
        </p>
      </ModalFooter>
    </Modal>
  );
}

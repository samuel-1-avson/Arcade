'use client';

import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePartyStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export function PartyFAB() {
  const { isDrawerOpen, setDrawerOpen, currentParty, isInParty } = usePartyStore();

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 bg-elevated border border-white/[0.08]',
          'flex items-center justify-center z-50',
          'hover:bg-raised hover:border-accent-border hover:-translate-y-0.5',
          'transition-all duration-300 shadow-lg',
          isDrawerOpen && 'bg-accent-dim border-accent'
        )}
      >
        <Users className={cn(
          'w-6 h-6 transition-colors',
          isDrawerOpen ? 'text-accent' : 'text-muted-foreground'
        )} />
        
        {/* Badge */}
        {(isInParty || currentParty?.members.length) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-background text-[10px] font-bold flex items-center justify-center">
            {currentParty?.members.length || 0}
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'fixed top-0 right-0 h-full w-80 bg-surface border-l border-white/[0.05] z-50',
        'transition-transform duration-300 ease-out',
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            Social
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          {!isInParty ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-4">
                Create a party to play with friends
              </p>
              <Button onClick={() => usePartyStore.getState().createParty()}>
                Create Party
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Party Code
                </span>
                <span className="font-mono text-accent bg-accent-dim px-2 py-1">
                  {currentParty?.code}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Members ({currentParty?.members.length || 0})
                </p>
                {currentParty?.members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members yet. Share the code!
                  </p>
                )}
              </div>
              
              <Button 
                variant="danger" 
                className="w-full mt-6"
                onClick={() => usePartyStore.getState().leaveParty()}
              >
                Leave Party
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

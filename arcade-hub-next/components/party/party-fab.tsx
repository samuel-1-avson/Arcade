'use client';

import { useState, useRef, useEffect } from 'react';
import { Users, Send, LogOut, Crown, Check, X, Loader2, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePartyStore } from '@/lib/store/party-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


export function PartyFAB() {
  const { 
    isDrawerOpen, 
    setDrawerOpen, 
    currentParty, 
    isInParty, 
    messages,
    createParty, 
    leaveParty,
    joinParty,
    sendMessage,
    setReady,
    isLoading,
    error,
    unreadCount,
    clearError
  } = usePartyStore();
  
  const user = useAuthStore((state) => state.user);
  const [joinCode, setJoinCode] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isDrawerOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isDrawerOpen]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isDrawerOpen && isInParty && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDrawerOpen, isInParty]);

  const handleCreateParty = async () => {
    clearError();
    await createParty();
  };

  const handleJoinParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    clearError();
    const success = await joinParty(joinCode.trim().toUpperCase());
    if (success) {
      setJoinCode('');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    await sendMessage(messageText.trim());
    setMessageText('');
  };

  const handleCopyCode = () => {
    if (currentParty?.code) {
      navigator.clipboard.writeText(currentParty.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLeader = currentParty?.leaderId === user?.uid;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 bg-elevated border border-white/[0.08] rounded-full',
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
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-background text-[10px] font-bold flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Party Size Badge */}
        {isInParty && unreadCount === 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-[10px] font-bold flex items-center justify-center rounded-full">
            {currentParty?.members.length || 0}
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'fixed top-0 right-0 h-full w-96 bg-surface border-l border-white/[0.05] z-50',
        'transition-transform duration-300 ease-out flex flex-col',
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              Party
            </h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!user ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Sign in to create or join a party and play with friends
              </p>
            </div>
          ) : !isInParty ? (
            <div className="p-6 space-y-6">
              {/* Create Party Section */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Crown className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-1">Create a Party</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a new party and invite friends to join
                  </p>
                </div>
                <Button 
                  onClick={handleCreateParty}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Crown className="w-4 h-4 mr-2" />
                  )}
                  Create Party
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Join Party Section */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-primary mb-1">Join a Party</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a party code to join friends
                  </p>
                </div>
                <form onSubmit={handleJoinParty} className="space-y-3">
                  <Input
                    placeholder="Enter 6-digit code (e.g., ABC123)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center font-mono text-lg tracking-wider uppercase"
                  />
                  <Button 
                    type="submit"
                    disabled={isLoading || joinCode.length !== 6}
                    variant="secondary"
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2 rotate-180" />
                    )}
                    Join Party
                  </Button>
                </form>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Party Info */}
              <div className="p-4 border-b border-white/[0.05] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Party Code
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div 
                  onClick={handleCopyCode}
                  className="font-mono text-2xl font-bold text-accent bg-accent/10 text-center py-3 rounded-lg cursor-pointer hover:bg-accent/20 transition-colors tracking-wider"
                >
                  {currentParty?.code}
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Share this code with friends to invite them
                </p>
              </div>

              {/* Members List */}
              <div className="p-4 border-b border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Members ({currentParty?.members.length || 0})
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    currentParty?.status === 'waiting' && 'bg-yellow-500/20 text-yellow-400',
                    currentParty?.status === 'playing' && 'bg-green-500/20 text-green-400'
                  )}>
                    {currentParty?.status === 'waiting' ? 'Waiting' : 'Playing'}
                  </span>
                </div>
                <div className="space-y-2">
                  {currentParty?.members.map((member) => (
                    <div 
                      key={member.userId}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {member.userId === currentParty.leaderId && (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-sm text-primary">{member.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isReady ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Check className="w-3 h-3" />
                            Ready
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not ready</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Ready Button */}
                {currentParty?.status === 'waiting' && (
                  <Button
                    onClick={() => {
                      const member = currentParty.members.find(m => m.userId === user?.uid);
                      setReady(!member?.isReady);
                    }}
                    variant={currentParty.members.find(m => m.userId === user?.uid)?.isReady ? 'outline' : 'default'}
                    className="w-full mt-3"
                  >
                    {currentParty.members.find(m => m.userId === user?.uid)?.isReady ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Cancel Ready
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        I'm Ready
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-white/[0.05] flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Party Chat
                  </span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No messages yet. Say hello!
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div 
                          key={msg.id}
                          className={cn(
                            'flex flex-col',
                            msg.userId === user?.uid && 'items-end'
                          )}
                        >
                          <div className={cn(
                            'max-w-[85%] px-3 py-2 rounded-lg',
                            msg.userId === user?.uid 
                              ? 'bg-accent text-accent-foreground' 
                              : 'bg-white/10 text-primary'
                          )}>
                            {msg.userId !== user?.uid && (
                              <span className="text-xs opacity-70 block mb-0.5">
                                {msg.displayName}
                              </span>
                            )}
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.05]">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="submit"
                      disabled={!messageText.trim()}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Leave Button */}
              <div className="p-4 border-t border-white/[0.05]">
                <Button 
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => leaveParty()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Party
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

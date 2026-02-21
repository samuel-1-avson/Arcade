'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  Search, 
  MessageSquare, 
  Gamepad2, 
  Circle, 
  X, 
  Check,
  BarChart3,
  Send,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { friendsService, Friend, FriendRequest } from '@/lib/firebase/services/friends';
import { messagesService, Message, Conversation } from '@/lib/firebase/services/messages';
import { cn } from '@/lib/utils';

export default function FriendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{userId: string; displayName: string; photoURL?: string; currentGame?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string; displayName: string; photoURL?: string; level: number}[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'online' | 'requests'>('friends');

  // Messaging state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageUnsubscribe, setMessageUnsubscribe] = useState<(() => void) | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const [friendsData, requestsData, onlineData, convData] = await Promise.all([
        friendsService.getFriends(user.id),
        friendsService.getPendingRequests(user.id),
        friendsService.getOnlineUsers(),
        messagesService.getConversations(user.id),
      ]);
      
      setFriends(friendsData);
      setRequests(requestsData);
      setConversations(convData);
      
      // Filter out current user and friends from online users
      const friendIds = new Set(friendsData.map(f => f.id));
      setOnlineUsers(onlineData.filter(u => u.userId !== user.id && !friendIds.has(u.userId)));
    } catch (error) {
      console.error('[Friends] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
    
    // Subscribe to friends updates
    if (user?.id) {
      const unsubscribeFriends = friendsService.subscribeToFriends(user.id, (updatedFriends) => {
        setFriends(updatedFriends);
      });
      
      // Subscribe to online users
      const unsubscribeOnline = friendsService.subscribeToOnlineUsers((onlineUsers) => {
        const friendIds = new Set(friends.map(f => f.id));
        setOnlineUsers(onlineUsers.filter(u => u.userId !== user.id && !friendIds.has(u.userId)));
      });
      
      // Subscribe to conversations
      const unsubscribeConv = messagesService.subscribeToConversations(user.id, (convs) => {
        setConversations(convs);
      });
      
      return () => {
        unsubscribeFriends();
        unsubscribeOnline();
        unsubscribeConv();
        if (messageUnsubscribe) messageUnsubscribe();
      };
    }
  }, [user?.id, loadData]);

  const handleSearch = async () => {
    if (!user?.id || searchQuery.length < 3) return;
    
    const results = await friendsService.searchUsers(searchQuery, user.id);
    setSearchResults(results);
  };

  const handleSendRequest = async (targetUserId: string) => {
    if (!user?.id) return;
    
    const result = await friendsService.sendFriendRequest(user.id, targetUserId);
    if (result.success) {
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
      alert('Friend request sent!');
    } else {
      alert(result.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.id) return;
    
    const success = await friendsService.acceptFriendRequest(requestId, user.id);
    if (success) {
      loadData();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.id) return;
    
    const success = await friendsService.rejectFriendRequest(requestId, user.id);
    if (success) {
      loadData();
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('Remove this friend?')) return;
    
    const success = await friendsService.removeFriend(friendshipId);
    if (success) {
      loadData();
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/hub/profile/${userId}/`);
  };

  const handleOpenMessages = async (friend: Friend) => {
    if (!user?.id) return;
    
    // Get or create conversation
    const conversationId = await messagesService.getOrCreateConversation(user.id, friend.id);
    if (!conversationId) return;
    
    // Find or create conversation object
    const existingConv = conversations.find(c => c.id === conversationId);
    const conv: Conversation = existingConv || {
      id: conversationId,
      participants: [user.id, friend.id],
      participantNames: [user.displayName || 'You', friend.displayName],
      participantPhotos: [user.avatar || '', friend.photoURL || ''],
      unreadCount: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSelectedConversation(conv);
    setShowMessageModal(true);
    
    // Load messages
    const msgs = await messagesService.getMessages(conversationId);
    setMessages(msgs);
    
    // Mark as read
    await messagesService.markAsRead(conversationId, user.id);
    
    // Subscribe to new messages
    if (messageUnsubscribe) messageUnsubscribe();
    const unsub = messagesService.subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
    });
    setMessageUnsubscribe(() => unsub);
  };

  const handleSendMessage = async () => {
    if (!user?.id || !selectedConversation || !messageText.trim()) return;
    
    setIsSendingMessage(true);
    try {
      const success = await messagesService.sendMessage(
        selectedConversation.id,
        user.id,
        messageText.trim()
      );
      
      if (success) {
        setMessageText('');
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getUnreadCount = (friendId: string) => {
    const conv = conversations.find(c => 
      c.participants.includes(friendId) && c.participants.includes(user?.id || '')
    );
    return conv?.unreadCount?.[user?.id || ''] || 0;
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Sign in to view your friends and connect with other players</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-primary mb-2">
            Friends & Social
          </h1>
          <p className="text-muted-foreground text-sm">
            Connect with friends and see who is online
          </p>
        </div>
        <Button onClick={() => setShowSearchModal(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Friend
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-elevated border border-white/[0.06] p-4 text-center">
          <p className="font-display text-2xl font-bold text-accent">{friends.length}</p>
          <p className="text-xs text-muted-foreground uppercase">Friends</p>
        </div>
        <div className="bg-elevated border border-white/[0.06] p-4 text-center">
          <p className="font-display text-2xl font-bold text-success">
            {friends.filter(f => f.isOnline).length}
          </p>
          <p className="text-xs text-muted-foreground uppercase">Online</p>
        </div>
        <div className="bg-elevated border border-white/[0.06] p-4 text-center">
          <p className="font-display text-2xl font-bold text-warning">{requests.length}</p>
          <p className="text-xs text-muted-foreground uppercase">Requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06]">
        {[
          { id: 'friends', label: 'Friends', count: friends.length },
          { id: 'online', label: 'Online Now', count: onlineUsers.length },
          { id: 'requests', label: 'Requests', count: requests.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-2 text-sm font-medium uppercase tracking-wider border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-primary'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 text-xs bg-accent-dim text-accent px-2 py-0.5 rounded">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <>
                {friends.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground bg-elevated border border-white/[0.06]">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No friends yet</p>
                    <p className="text-sm mt-2">Search for players and send friend requests!</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-elevated border border-white/[0.06] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-surface border border-white/[0.08] flex items-center justify-center overflow-hidden">
                            {friend.photoURL ? (
                              <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-elevated",
                            friend.isOnline ? "bg-green-500" : "bg-gray-500"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-primary">{friend.displayName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Level {friend.level}</span>
                            {friend.currentGame && (
                              <span className="flex items-center gap-1 text-accent">
                                <Gamepad2 className="w-3 h-3" />
                                Playing {friend.currentGame}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getUnreadCount(friend.id) > 0 && (
                          <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                            {getUnreadCount(friend.id)}
                          </span>
                        )}
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleOpenMessages(friend)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewProfile(friend.id)}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRemoveFriend(friend.friendshipId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'online' && (
              <>
                {onlineUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground bg-elevated border border-white/[0.06]">
                    <Circle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No other players online</p>
                    <p className="text-sm mt-2">Check back later or invite friends!</p>
                  </div>
                ) : (
                  onlineUsers.map((onlineUser) => (
                    <div
                      key={onlineUser.userId}
                      className="bg-elevated border border-white/[0.06] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-surface border border-white/[0.08] flex items-center justify-center overflow-hidden">
                            {onlineUser.photoURL ? (
                              <img src={onlineUser.photoURL} alt={onlineUser.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-elevated bg-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">{onlineUser.displayName}</p>
                          {onlineUser.currentGame && (
                            <p className="text-xs text-accent flex items-center gap-1">
                              <Gamepad2 className="w-3 h-3" />
                              Playing {onlineUser.currentGame}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewProfile(onlineUser.userId)}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSendRequest(onlineUser.userId)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'requests' && (
              <>
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground bg-elevated border border-white/[0.06]">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-elevated border border-white/[0.06] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-surface border border-white/[0.08] flex items-center justify-center overflow-hidden">
                          {request.fromUserPhoto ? (
                            <img src={request.fromUserPhoto} alt={request.fromUserName} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-primary">{request.fromUserName}</p>
                          <p className="text-xs text-muted-foreground">
                            Sent {request.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Search Modal */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Find Friends"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="text-xs text-muted-foreground">Enter at least 3 characters</p>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 bg-surface border border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-elevated flex items-center justify-center">
                    {result.photoURL ? (
                      <img src={result.photoURL} alt={result.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-primary">{result.displayName}</p>
                    <p className="text-xs text-muted-foreground">Level {result.level}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleViewProfile(result.id)}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleSendRequest(result.id)}>
                    Add
                  </Button>
                </div>
              </div>
            ))}
            {searchResults.length === 0 && searchQuery.length >= 3 && (
              <p className="text-center text-muted-foreground py-4">No users found</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedConversation(null);
          setMessages([]);
          if (messageUnsubscribe) {
            messageUnsubscribe();
            setMessageUnsubscribe(null);
          }
        }}
        title={selectedConversation?.participantNames.find(n => n !== user?.displayName) || 'Messages'}
        size="md"
      >
        <div className="space-y-4">
          {/* Messages */}
          <div className="h-64 overflow-y-auto space-y-3 p-2 bg-surface border border-white/[0.06]">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages yet. Say hello!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col',
                    msg.senderId === user?.id ? 'items-end' : 'items-start'
                  )}
                >
                  <div className={cn(
                    'max-w-[80%] px-3 py-2 rounded-lg',
                    msg.senderId === user?.id
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-elevated text-primary'
                  )}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isSendingMessage || !messageText.trim()}
            >
              {isSendingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

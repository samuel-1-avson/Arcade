export interface Party {
  id: string;
  code: string;
  leaderId: string;
  leaderName: string;
  members: PartyMember[];
  memberIds: string[];
  status: 'waiting' | 'playing' | 'ended';
  gameId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartyMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  isReady: boolean;
  joinedAt: Date;
}

export interface PartyMessage {
  id: string;
  partyId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  text: string;
  timestamp: Date;
}

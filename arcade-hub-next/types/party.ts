export interface Party {
  id: string;
  code: string;
  hostId: string;
  members: PartyMember[];
  status: 'waiting' | 'playing' | 'ended';
  createdAt: Date;
}

export interface PartyMember {
  userId: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'away' | 'playing';
  isHost: boolean;
}

export interface PartyMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: Date;
}

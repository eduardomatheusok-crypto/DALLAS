import type { User } from './User';

export interface GroupSummary {
  id: string;
  name: string;
  description?: string;
  icon: string;
  memberCount: number;
  ownerId: string;
  createdAt: string;
}

export interface Member {
  user: User;
  role: string;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon: string;
  inviteCode: string;
  ownerId: string;
  joined: boolean;
  myRole: string;
  memberCount: number;
  members: Member[];
  createdAt: string;
}
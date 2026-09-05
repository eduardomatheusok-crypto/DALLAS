import type { User } from './User';

export type CompetitionStatus = 'PENDING' | 'ACTIVE' | 'FINISHED';

export interface Competition {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  status: CompetitionStatus;
  startsAt: string;
  endsAt: string;
  awardedPositions: number;
  participantCount: number;
  joined: boolean;
  ownerId: string;
  createdAt: string;
}

export interface RankingStats {
  progressPct: number;
  trainedDays: number;
  totalVolume: number;
  prCount: number;
}

export interface RankingEntry {
  user: User;
  position: number;
  totalScore: number;
  progressionScore: number;
  consistencyScore: number;
  volumeScore: number;
  goalsScore: number;
  stats: RankingStats;
}
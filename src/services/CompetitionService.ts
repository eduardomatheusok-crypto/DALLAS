import { groupsApi, ensureApiOnline, type CreateCompetitionInput } from '../api';
import type { Competition, RankingEntry } from '../models';

export function competitiveStatusLabel(status: Competition['status']): string {
  switch (status) {
    case 'PENDING':
      return 'Em breve';
    case 'ACTIVE':
      return 'Ao vivo';
    case 'FINISHED':
      return 'Encerrada';
  }
}

export class CompetitionService {
  async listByGroup(groupId: string): Promise<Competition[]> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para ver as competições.');
    }
    return groupsApi.competitions(groupId);
  }

  async create(groupId: string, input: CreateCompetitionInput): Promise<Competition> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para criar uma competição.');
    }
    return groupsApi.createCompetition(groupId, input);
  }

  async join(id: string): Promise<Competition> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para participar.');
    }
    return groupsApi.joinCompetition(id);
  }

  async ranking(competitionId: string): Promise<RankingEntry[]> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para ver o ranking.');
    }
    return groupsApi.ranking(competitionId);
  }

  async finish(id: string): Promise<void> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para encerrar a competição.');
    }
    return groupsApi.finishCompetition(id);
  }
}

export const competitionService = new CompetitionService();
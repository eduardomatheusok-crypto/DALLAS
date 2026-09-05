import { apiGet, apiPost, apiDelete, isApiOnline } from './client';
import {
  groupSummaryFromDto,
  groupFromDto,
  competitionFromDto,
  rankingEntryFromDto,
  messageFromDto,
  type GroupSummaryDto,
  type GroupDto,
  type CompetitionDto,
  type RankingEntryDto,
  type ChatMessageDto,
} from './dto';
import type {
  GroupSummary,
  Group,
  Competition,
  RankingEntry,
  ChatMessage,
} from '../models';

export type CreateCompetitionInput = {
  name: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  awardedPositions?: number;
};

export interface GroupsApi {
  enabled(): boolean;
  getAll(): Promise<GroupSummary[]>;
  getDetail(id: string): Promise<Group>;
  create(name: string, description: string, icon: string): Promise<Group>;
  joinByCode(inviteCode: string): Promise<Group>;
  join(id: string): Promise<Group>;
  leave(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  competitions(groupId: string): Promise<Competition[]>;
  createCompetition(groupId: string, input: CreateCompetitionInput): Promise<Competition>;
  joinCompetition(id: string): Promise<Competition>;
  ranking(competitionId: string): Promise<RankingEntry[]>;
  finishCompetition(id: string): Promise<void>;
  messages(groupId: string, before?: string, limit?: number): Promise<ChatMessage[]>;
  sendMessage(groupId: string, text: string): Promise<ChatMessage>;
}

export const groupsApi: GroupsApi = {
  enabled() {
    return isApiOnline();
  },
  async getAll() {
    const list = await apiGet<GroupSummaryDto[]>('/api/groups');
    return list.map(groupSummaryFromDto);
  },
  async getDetail(id) {
    const dto = await apiGet<GroupDto>(`/api/groups/${id}`);
    return groupFromDto(dto);
  },
  async create(name, description, icon) {
    const dto = await apiPost<GroupDto>('/api/groups', { name, description, icon });
    return groupFromDto(dto);
  },
  async joinByCode(inviteCode) {
    const dto = await apiPost<GroupDto>('/api/groups/join', { inviteCode });
    return groupFromDto(dto);
  },
  async join(id) {
    const dto = await apiPost<GroupDto>(`/api/groups/${id}/join`, {});
    return groupFromDto(dto);
  },
  async leave(id) {
    return apiDelete(`/api/groups/${id}/leave`, 15000);
  },
  async remove(id) {
    return apiDelete(`/api/groups/${id}`, 15000);
  },
  async competitions(groupId) {
    const list = await apiGet<CompetitionDto[]>(`/api/groups/${groupId}/competitions`);
    return list.map(competitionFromDto);
  },
  async createCompetition(groupId, input) {
    const dto = await apiPost<CompetitionDto>(`/api/groups/${groupId}/competitions`, input);
    return competitionFromDto(dto);
  },
  async joinCompetition(id) {
    const dto = await apiPost<CompetitionDto>(`/api/competitions/${id}/join`, {});
    return competitionFromDto(dto);
  },
  async ranking(competitionId) {
    const list = await apiGet<RankingEntryDto[]>(`/api/competitions/${competitionId}/ranking`);
    return list.map(rankingEntryFromDto);
  },
  async finishCompetition(id) {
    return apiPost<void>(`/api/competitions/${id}/finish`, {});
  },
  async messages(groupId, before, limit) {
    const params: Record<string, string> = {};
    if (before) params.before = before;
    if (limit) params.limit = String(limit);
    const list = await apiGet<ChatMessageDto[]>(`/api/groups/${groupId}/messages`, params);
    return list.map(messageFromDto);
  },
  async sendMessage(groupId, text) {
    const dto = await apiPost<ChatMessageDto>(`/api/groups/${groupId}/messages`, { text });
    return messageFromDto(dto);
  },
};
import { storage } from '../storage';
import { groupsApi, ensureApiOnline } from '../api';
import type { GroupSummary, Group } from '../models';

export class GroupService {
  async getAll(): Promise<GroupSummary[]> {
    if (await ensureApiOnline()) {
      try {
        const remote = await groupsApi.getAll();
        await storage.setGroups(remote);
        return remote;
      } catch {
        // segue para o cache local
      }
    }
    return storage.getGroups();
  }

  async getDetail(id: string): Promise<Group> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para ver o grupo.');
    }
    return groupsApi.getDetail(id);
  }

  async create(name: string, description: string, icon: string): Promise<Group> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para criar um grupo.');
    }
    return groupsApi.create(name, description, icon);
  }

  async joinByCode(inviteCode: string): Promise<Group> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para entrar em um grupo.');
    }
    return groupsApi.joinByCode(inviteCode);
  }

  async join(id: string): Promise<Group> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para entrar no grupo.');
    }
    return groupsApi.join(id);
  }

  async leave(id: string): Promise<void> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para sair do grupo.');
    }
    return groupsApi.leave(id);
  }

  async remove(id: string): Promise<void> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para excluir o grupo.');
    }
    return groupsApi.remove(id);
  }
}

export const groupService = new GroupService();
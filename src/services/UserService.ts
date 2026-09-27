import { storage } from '../storage';
import type { User } from '../models';
import { userApi } from '../api';
import { persistImage } from './MediaService';

export class UserService {
  /** Recupera o usuário da sessão persistida sem tocar a rede. */
  async getCachedUser(): Promise<User | null> {
    return storage.getUser();
  }

  async getOrCreate(): Promise<User> {
    const existing = await storage.getUser();
    if (userApi.enabled()) {
      try {
        const remote = await userApi.authMe();
        const profile = await storage.getCustom<Partial<User>>(`@dallas/profile/${remote.id}`, {});
        const merged = { ...(existing?.id === remote.id ? existing : {}), ...remote, ...profile };
        await storage.setUser(merged);
        return merged;
      } catch {
        // segue para local
      }
    }
    if (existing) return existing;
    const user: User = {
      id: 'local-user',
      username: 'local',
      name: 'Atleta',
      createdAt: new Date().toISOString(),
    };
    await storage.setUser(user);
    return user;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getToken();
    return !!token;
  }

  async register(username: string, password: string, avatarUrl?: string): Promise<User> {
    const { user } = await userApi.register(username, password);
    if (avatarUrl) {
      user.avatarUrl = await persistImage(avatarUrl);
      await storage.setCustom(`@dallas/profile/${user.id}`, { avatarUrl: user.avatarUrl });
    }
    await storage.setUser(user);
    return user;
  }

  async updateProfile(updates: Partial<User>): Promise<User | null> {
    const user = await storage.getUser();
    if (!user) return null;
    const persisted = { ...updates };
    if (persisted.avatarUrl) persisted.avatarUrl = await persistImage(persisted.avatarUrl);
    const profile = await storage.getCustom<Partial<User>>(`@dallas/profile/${user.id}`, {});
    await storage.setCustom(`@dallas/profile/${user.id}`, { ...profile, ...persisted });
    const updated = { ...user, ...persisted };
    await storage.setUser(updated);
    return updated;
  }

  async login(username: string, password: string): Promise<User> {
    const { user } = await userApi.login(username, password);
    const profile = await storage.getCustom<Partial<User>>(`@dallas/profile/${user.id}`, {});
    const merged = { ...user, ...profile };
    await storage.setUser(merged);
    return merged;
  }

  async logout(): Promise<void> {
    await storage.setToken(null);
    await storage.setUser(null);
    await storage.setCustom('@treino/achievements', null);
  }
}

export const userService = new UserService();
import { storage } from '../storage';
import type { User } from '../models';
import { userApi } from '../api';

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
        await storage.setUser(remote);
        return remote;
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

  async register(username: string, password: string): Promise<User> {
    const { user } = await userApi.register(username, password);
    await storage.setUser(user);
    return user;
  }

  async login(username: string, password: string): Promise<User> {
    const { user } = await userApi.login(username, password);
    await storage.setUser(user);
    return user;
  }

  async logout(): Promise<void> {
    await storage.setToken(null);
    await storage.setUser(null);
  }
}

export const userService = new UserService();
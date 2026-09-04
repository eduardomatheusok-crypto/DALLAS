import { apiGet, apiPost, isApiOnline } from './client';
import type { UserDto } from './dto';
import type { User } from '../models';
import { storage } from '../storage';

export interface AuthResult {
  token: string;
  user: User;
}

export interface UserApi {
  enabled(): boolean;
  register(username: string, password: string): Promise<AuthResult>;
  login(username: string, password: string): Promise<AuthResult>;
  authMe(): Promise<User>;
  getOrCreate(name?: string): Promise<User>;
}

/**
 * Janela maior para chamadas de autenticação: no primeiro acesso o backend faz a
 * primeira escrita no banco, atualização de schema e emissão de token, o que pode
 * demorar mais do que o timeout padrão.
 */
const AUTH_TIMEOUT_MS = 20000;

async function ensureDeviceId(): Promise<string> {
  let id = await storage.getDeviceId();
  if (!id) {
    // gerado de forma determinística a partir de valores globais (sem lib extra)
    const rand = Math.random().toString(36).slice(2) + Date.now().toString(36);
    id = `device-${rand}`;
    await storage.setDeviceId(id);
  }
  return id;
}

/** Resolve o deviceId persistente desta instalação (usado para migração/vínculo). */
export async function getDeviceId(): Promise<string> {
  return ensureDeviceId();
}

function toUser(d: UserDto): User {
  return { id: d.id, username: d.username, name: d.name, createdAt: d.createdAt };
}

export const userApi: UserApi = {
  enabled() {
    return isApiOnline();
  },
  async register(username, password) {
    const deviceId = await ensureDeviceId();
    const res = await apiPost<{ token: string; user: UserDto }>('/api/auth/register', {
      username,
      password,
      deviceId,
    }, AUTH_TIMEOUT_MS);
    await storage.setToken(res.token);
    return { token: res.token, user: toUser(res.user) };
  },
  async login(username, password) {
    const res = await apiPost<{ token: string; user: UserDto }>('/api/auth/login', {
      username,
      password,
    }, AUTH_TIMEOUT_MS);
    await storage.setToken(res.token);
    return { token: res.token, user: toUser(res.user) };
  },
  async authMe() {
    const dto = await apiGet<UserDto>('/api/auth/me', undefined, AUTH_TIMEOUT_MS);
    return toUser(dto);
  },
  async getOrCreate(name) {
    if (this.enabled()) {
      try {
        const dto = await apiGet<UserDto>('/api/auth/me');
        return toUser(dto);
      } catch {
        // segue para local
      }
    }
    const existing = await storage.getUser();
    if (existing) return existing;
    const user: User = {
      id: 'local-user',
      username: 'local',
      name: name ?? 'Atleta',
      createdAt: new Date().toISOString(),
    };
    await storage.setUser(user);
    return user;
  },
};
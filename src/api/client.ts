import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { storage } from '../storage';

let apiOnline = false;
let checking = false;
let listeners = new Set<(online: boolean) => void>();

export function isApiOnline(): boolean {
  return apiOnline;
}

/**
 * Garante que o status "online" esteja atualizado antes de qualquer decisão de
 * bloqueio. Se o flag antigo estiver desligado (ex.: backend subiu depois do
 * boot do app), refaz o ping uma única vez.
 */
export async function ensureApiOnline(): Promise<boolean> {
  if (apiOnline) return true;
  return refreshApiStatus(true);
}

export function onApiStatusChange(cb: (online: boolean) => void): () => void {
  listeners.add(cb);
  if (checking) cb(apiOnline);
  return () => {
    listeners.delete(cb);
  };
}

function setOnline(online: boolean) {
  if (apiOnline === online) return;
  apiOnline = online;
  listeners.forEach((cb) => cb(online));
}

async function ping(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Verifica se a API está acessível. Evita múltiplas checagens simultâneas.
 */
export async function refreshApiStatus(force = false): Promise<boolean> {
  if (checking && !force) return apiOnline;
  checking = true;
  try {
    const online = await ping();
    setOnline(online);
    return online;
  } finally {
    checking = false;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? API_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const token = await storage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      setOnline(false);
      throw new Error('Conecte-se à internet e tente novamente.');
    }
    if (!res.ok) {
      let message = `API error ${res.status}: ${path}`;
      try {
        const body = await res.json();
        if (body && typeof body.message === 'string' && body.message) {
          message = body.message;
        }
      } catch {
        // corpo não-JSON; mantém mensagem padrão
      }
      throw new Error(message);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string>, timeoutMs?: number): Promise<T> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return request<T>(`${path}${query}`, { timeoutMs });
}

export async function apiPost<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
  return request<T>(path, { method: 'POST', body, timeoutMs });
}

export async function apiPut<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
  return request<T>(path, { method: 'PUT', body, timeoutMs });
}

export async function apiDelete(path: string, timeoutMs?: number): Promise<void> {
  return request<void>(path, { method: 'DELETE', timeoutMs });
}

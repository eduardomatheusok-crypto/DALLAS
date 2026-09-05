import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEV_API_PORT = 8080;

/**
 * Resolve o host da API:
 * - Prioridade 1: EXPO_PUBLIC_API_URL (definida no build — APK via EAS,
 *   web via Vercel). Fica fixa no bundle.
 * - Prioridade 2 (dev): host do Metro + porta 8080. Funciona em aparelho
 *   físico, emulador e simulador sem precisar editar IP.
 * - Fallback sem dev server: localhost/10.0.2.2 (só emulador).
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${DEV_API_PORT}`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_TIMEOUT_MS = 15000;
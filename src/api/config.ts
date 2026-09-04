import { Platform } from 'react-native';

/**
 * Base URL da API FitTreino (Spring Boot).
 *
 * - iOS simulator / web: http://localhost:8080
 * - Android emulator: use http://10.0.2.2:8080
 * - Dispositivo físico: use o IP da sua máquina na rede local, ex: http://192.168.1.10:8080
 *
 * Ajuste abaixo conforme seu ambiente.
 */
export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'
    : 'http://localhost:8080';

export const API_TIMEOUT_MS = 15000;

import { storage } from '../storage';
import type { UserTrainingPreferences } from '../models';

/**
 * Armazena as preferências de treino localmente (vinculadas ao userId).
 *
 * Mantido fora do modelo de conta do backend para não exigir mudanças de schema.
 * Futuramente pode ser sincronizado/migrado mantendo esta interface como contrato.
 */
export class TrainingPreferencesService {
  async getFor(userId: string): Promise<UserTrainingPreferences | null> {
    const prefs = await storage.getTrainingPreferences<UserTrainingPreferences>();
    return prefs && prefs.userId === userId ? prefs : null;
  }

  async save(prefs: UserTrainingPreferences): Promise<void> {
    await storage.setTrainingPreferences<UserTrainingPreferences>(prefs);
  }

  async clear(): Promise<void> {
    await storage.setTrainingPreferences(null);
  }
}

export const trainingPreferencesService = new TrainingPreferencesService();
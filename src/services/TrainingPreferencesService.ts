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
    if (!userId) return null;
    const perUser = await storage.getCustom<UserTrainingPreferences | null>(
      `@dallas/preferences/${userId}`,
      null,
    );
    if (perUser && perUser.userId === userId) {
      return perUser;
    }
    const legacy = await storage.getTrainingPreferences<UserTrainingPreferences>();
    return legacy && legacy.userId === userId ? legacy : null;
  }

  async save(prefs: UserTrainingPreferences): Promise<void> {
    if (prefs.userId) {
      await storage.setCustom(`@dallas/preferences/${prefs.userId}`, prefs);
    }
    await storage.setTrainingPreferences<UserTrainingPreferences>(prefs);
  }

  async clear(): Promise<void> {
    await storage.setTrainingPreferences(null);
  }
}

export const trainingPreferencesService = new TrainingPreferencesService();
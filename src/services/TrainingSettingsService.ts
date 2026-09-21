import { storage } from '../storage';
import {
  createDefaultTrainingSettings,
  type TrainingSettings,
} from '../models';

/**
 * Armazena as configurações de treino localmente.
 *
 * Segue o mesmo padrão de `TrainingPreferencesService`: mantido fora do modelo
 * de conta do backend para não exigir mudanças de schema. Campos novos entram
 * nos valores padrão, então usuários existentes não precisam reconfigurar.
 */
export class TrainingSettingsService {
  async get(): Promise<TrainingSettings> {
    const stored = await storage.getTrainingSettings<TrainingSettings>();
    const base = stored ?? createDefaultTrainingSettings();
    return { ...createDefaultTrainingSettings(), ...base };
  }

  async save(settings: TrainingSettings): Promise<TrainingSettings> {
    const next: TrainingSettings = {
      ...createDefaultTrainingSettings(),
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await storage.setTrainingSettings(next);
    return next;
  }

  async update(patch: Partial<TrainingSettings>): Promise<TrainingSettings> {
    const current = await this.get();
    return this.save({ ...current, ...patch });
  }

  async clear(): Promise<void> {
    await storage.setTrainingSettings(null);
  }
}

export const trainingSettingsService = new TrainingSettingsService();
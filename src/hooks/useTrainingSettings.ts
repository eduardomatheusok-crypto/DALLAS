import { useCallback, useEffect, useState } from 'react';
import { trainingSettingsService } from '../services';
import { createDefaultTrainingSettings, type TrainingSettings } from '../models';

/**
 * Hook de acesso às configurações de treino (descanso padrão, notificações,
 * lembretes). Persiste via `trainingSettingsService`.
 */
export function useTrainingSettings() {
  const [settings, setSettings] = useState<TrainingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const next = await trainingSettingsService.get();
    setSettings(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(async (patch: Partial<TrainingSettings>) => {
    const next = await trainingSettingsService.update(patch);
    setSettings(next);
    return next;
  }, []);

  return {
    settings: settings ?? createDefaultTrainingSettings(),
    loading,
    reload,
    update,
  };
}
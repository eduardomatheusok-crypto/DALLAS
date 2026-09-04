import { useCallback, useEffect, useState } from 'react';
import { workoutLogService } from '../services';
import type { WorkoutLog } from '../models';

export function useWorkoutLogs() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await workoutLogService.getAll();
    setLogs(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { logs, loading, reload };
}

import { useCallback, useEffect, useState } from 'react';
import { workoutService } from '../services';
import type { Workout } from '../models';

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await workoutService.getAll();
    setWorkouts(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { workouts, loading, reload };
}

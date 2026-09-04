import { useCallback, useEffect, useState } from 'react';
import { exerciseService } from '../services';
import type { Exercise, MuscleGroup } from '../models';

export function useExercises(query = '', group?: MuscleGroup) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await exerciseService.search(query);
    const filtered = group ? list.filter((e) => e.muscleGroup === group) : list;
    setExercises(filtered);
    setLoading(false);
  }, [query, group]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { exercises, loading, reload };
}

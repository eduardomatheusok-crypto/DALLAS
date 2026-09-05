import { useCallback, useEffect, useState } from 'react';
import { groupService } from '../services';
import type { Group } from '../models';

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await groupService.getDetail(groupId);
      setGroup(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o grupo.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const join = useCallback(async () => {
    const g = await groupService.join(groupId);
    setGroup(g);
    return g;
  }, [groupId]);

  const leave = useCallback(async () => {
    await groupService.leave(groupId);
  }, [groupId]);

  return { group, loading, error, reload, join, leave };
}
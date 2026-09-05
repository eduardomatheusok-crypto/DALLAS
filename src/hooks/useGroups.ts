import { useCallback, useEffect, useState } from 'react';
import { groupService } from '../services';
import type { GroupSummary } from '../models';

export function useGroups() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await groupService.getAll();
      setGroups(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { groups, loading, reload };
}
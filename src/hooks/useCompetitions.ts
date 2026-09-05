import { useCallback, useEffect, useState } from 'react';
import { competitionService } from '../services';
import type { CreateCompetitionInput } from '../api';
import type { Competition } from '../models';

export function useCompetitions(groupId: string) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await competitionService.listByGroup(groupId);
      setCompetitions(list);
    } catch (e) {
      // erro silencioso aqui: quem renderiza trata o vazio com EmptyState
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (input: CreateCompetitionInput) => {
      setBusy(true);
      try {
        const created = await competitionService.create(groupId, input);
        setCompetitions((prev) => [created, ...prev]);
        return created;
      } finally {
        setBusy(false);
      }
    },
    [groupId],
  );

  const join = useCallback(async (id: string) => {
    setBusy(true);
    try {
      const updated = await competitionService.join(id);
      setCompetitions((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } finally {
      setBusy(false);
    }
  }, []);

  return { competitions, loading, busy, reload, create, join };
}
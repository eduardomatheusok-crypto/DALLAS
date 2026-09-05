import { useCallback, useEffect, useState } from 'react';
import { competitionService } from '../services';
import type { RankingEntry } from '../models';

export function useRanking(competitionId: string | null) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(!!competitionId);

  const reload = useCallback(async () => {
    if (!competitionId) {
      setRanking([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await competitionService.ranking(competitionId);
      setRanking(list);
    } catch (e) {
      // vazio em caso de falha
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ranking, loading, reload };
}
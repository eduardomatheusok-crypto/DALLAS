import { useCallback, useEffect, useRef, useState } from 'react';
import { RestTimer, type RestTimerReason } from '../services';

/** Descrição de um intervalo de descanso que será exibido no app. */
export interface RestIntervalData {
  id: string;
  durationSeconds: number;
  title: string;
  subtitle: string;
}

export interface RestTimerUiState {
  active: boolean;
  paused: boolean;
  remainingMs: number;
  totalMs: number;
  progress: number;
  data: RestIntervalData | null;
}

const TICK_MS = 200;

/**
 * Hook que envolve o `RestTimer` (mecanismo reutilizável baseado em timestamps)
 * para uso em componentes. O `data` (título/subtítulo) é apenas apresentação —
 * as regras de duração continuam na camada de plano de intervalo.
 */
export function useRestTimer(
  options?: { onEnd?: (reason: RestTimerReason) => void },
) {
  const timerRef = useRef<RestTimer | null>(null);
  if (!timerRef.current) timerRef.current = new RestTimer();
  const timer = timerRef.current;

  const onEndRef = useRef(options?.onEnd);
  onEndRef.current = options?.onEnd;

  const dataRef = useRef<RestIntervalData | null>(null);
  const activeRef = useRef(false);

  const [ui, setUi] = useState<RestTimerUiState>({
    active: false,
    paused: false,
    remainingMs: 0,
    totalMs: 0,
    progress: 0,
    data: null,
  });

  const sync = useCallback(() => {
    setUi({
      active: timer.isActive,
      paused: timer.state === 'paused',
      remainingMs: timer.remainingMs,
      totalMs: timer.durationMs,
      progress: timer.progress(),
      data: dataRef.current,
    });
  }, [timer]);

  // Sincroniza em todas as mutações do timer (start/pause/resume/skip/finish).
  useEffect(() => {
    return timer.subscribe(() => {
      const wasActive = activeRef.current;
      const active = timer.isActive;
      activeRef.current = active;
      if (wasActive && !active) {
        onEndRef.current?.(timer.reason ?? 'cancelled');
      }
      sync();
    });
  }, [timer, sync]);

  // Drive de ticks enquanto está rodando (contagem derivada do timestamp).
  useEffect(() => {
    if (!ui.active || ui.paused) return undefined;
    const id = setInterval(() => {
      if (timer.hasElapsed()) {
        timer.finish();
      } else {
        sync();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [ui.active, ui.paused, timer, sync]);

  const start = useCallback(
    (data: RestIntervalData) => {
      dataRef.current = data;
      timer.start(data.durationSeconds);
    },
    [timer],
  );

  const pause = useCallback(() => timer.pause(), [timer]);
  const resume = useCallback(() => timer.resume(), [timer]);
  const skip = useCallback(() => timer.skip(), [timer]);
  const cancel = useCallback(() => {
    dataRef.current = null;
    timer.cancel();
  }, [timer]);

  return { ...ui, start, pause, resume, skip, cancel };
}
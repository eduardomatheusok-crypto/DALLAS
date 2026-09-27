/**
 * Mecanismo reutilizável de contagem regressiva para descanso/intervalos do DALLAS.
 *
 * A contagem é calculada a partir de timestamps reais (`Date.now()`), não de
 * decrementos por tick. Assim o tempo permanece correto mesmo se o JavaScript
 * for suspenso (tela bloqueada, app em segundo plano, ticks perdidos).
 *
 * Suporta fases unificadas em um único estado:
 * - 'intro': Contagem preparatória 3 → 2 → 1 antes do descanso começar
 * - 'resting': Descanso normal com layout completo ou minimizado
 * - 'outro': Contagem regressiva final 3 → 2 → 1 nos últimos 3 segundos
 * - 'idle': Inativo
 */

export type RestTimerState = 'idle' | 'running' | 'paused';
export type RestTimerReason = 'finished' | 'skipped' | 'cancelled';
export type RestTimerPhase = 'intro' | 'resting' | 'outro' | 'idle';

type Listener = () => void;

export class RestTimer {
  private _state: RestTimerState = 'idle';
  private _phase: RestTimerPhase = 'idle';
  private _durationMs = 0;
  private _endAt: number | null = null;
  private _remainingMs = 0;
  private _introEndAt: number | null = null;
  private _introDurationMs = 0;
  private _pausedIntroRemainingMs = 0;
  private _completed = false;
  private _reason: RestTimerReason | null = null;
  private readonly listeners = new Set<Listener>();

  get state(): RestTimerState {
    return this._state;
  }

  get phase(): RestTimerPhase {
    if (this._state === 'idle') return 'idle';

    if (this._phase === 'intro') {
      if (this._state === 'running' && this._introEndAt !== null && Date.now() >= this._introEndAt) {
        // Concluiu o intro: transita naturalmente para descanso
        this._phase = 'resting';
        this._endAt = Date.now() + this._durationMs;
        this._introEndAt = null;
      } else {
        return 'intro';
      }
    }

    const rem = this.remainingMs;
    if (rem <= 3000 && rem > 0) {
      return 'outro';
    }
    return 'resting';
  }

  get durationMs(): number {
    return this._durationMs;
  }

  get remainingMs(): number {
    // Se ainda está na fase de intro, o descanso ainda tem a duração total
    if (this._phase === 'intro') {
      if (this._state === 'running' && this._introEndAt !== null && Date.now() >= this._introEndAt) {
        this._phase = 'resting';
        this._endAt = Date.now() + this._durationMs;
        this._introEndAt = null;
      } else {
        return this._durationMs;
      }
    }

    if (this._state === 'running' && this._endAt !== null) {
      return Math.max(0, this._endAt - Date.now());
    }
    return Math.max(0, this._remainingMs);
  }

  get introRemainingSeconds(): number {
    if (this._phase !== 'intro') return 0;
    if (this._state === 'paused') {
      return Math.max(0, Math.ceil(this._pausedIntroRemainingMs / 1000));
    }
    if (this._introEndAt === null) return 0;
    return Math.max(0, Math.ceil((this._introEndAt - Date.now()) / 1000));
  }

  get isActive(): boolean {
    return this._state !== 'idle';
  }

  get completed(): boolean {
    return this._completed;
  }

  get reason(): RestTimerReason | null {
    return this._reason;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(durationSeconds: number, introSeconds: number = 3): void {
    const durationMs = Math.max(0, Math.round(durationSeconds * 1000));
    if (durationMs <= 0) {
      this._state = 'idle';
      this._phase = 'idle';
      this.emit();
      return;
    }

    this._durationMs = durationMs;
    this._remainingMs = durationMs;
    this._completed = false;
    this._reason = null;
    this._state = 'running';

    if (introSeconds > 0) {
      this._phase = 'intro';
      this._introDurationMs = introSeconds * 1000;
      this._introEndAt = Date.now() + this._introDurationMs;
      this._pausedIntroRemainingMs = this._introDurationMs;
      this._endAt = null;
    } else {
      this._phase = 'resting';
      this._introEndAt = null;
      this._endAt = Date.now() + durationMs;
    }

    this.emit();
  }

  /**
   * Pula a contagem inicial de 3s e inicia o descanso imediatamente.
   */
  skipIntro(): void {
    if (this._state === 'idle') return;
    this._phase = 'resting';
    this._introEndAt = null;
    this._endAt = Date.now() + this._durationMs;
    this._remainingMs = this._durationMs;
    this.emit();
  }

  pause(): void {
    if (this._state !== 'running') return;

    if (this._phase === 'intro') {
      this._pausedIntroRemainingMs = this._introEndAt !== null
        ? Math.max(0, this._introEndAt - Date.now())
        : 0;
    } else {
      const rem = this._endAt !== null ? Math.max(0, this._endAt - Date.now()) : 0;
      this._remainingMs = rem;
    }

    this._state = 'paused';
    this.emit();
  }

  resume(): void {
    if (this._state !== 'paused') return;

    if (this._phase === 'intro') {
      this._introEndAt = Date.now() + this._pausedIntroRemainingMs;
      this._state = 'running';
    } else {
      const remaining = Math.max(0, this._remainingMs);
      this._endAt = Date.now() + remaining;
      this._state = remaining > 0 ? 'running' : 'idle';
    }

    this.emit();
  }

  /** Adiciona ou subtrai segundos do descanso atual. */
  addSeconds(deltaSeconds: number): void {
    if (this._state === 'idle') return;
    const deltaMs = Math.round(deltaSeconds * 1000);
    this._durationMs = Math.max(1000, this._durationMs + deltaMs);

    if (this._phase === 'intro') {
      // Se ainda estiver na intro, ajusta a duração que será usada após a intro
      this._remainingMs = this._durationMs;
    } else {
      if (this._state === 'running' && this._endAt !== null) {
        this._endAt = Math.max(Date.now() + 1000, this._endAt + deltaMs);
      } else {
        this._remainingMs = Math.max(1000, this._remainingMs + deltaMs);
      }
    }

    this.emit();
  }

  /** Encerra o intervalo imediatamente (pelo usuário ou pelo sistema). */
  skip(): void {
    this._state = 'idle';
    this._phase = 'idle';
    this._remainingMs = 0;
    this._completed = true;
    this._reason = 'skipped';
    this.emit();
  }

  cancel(): void {
    this._state = 'idle';
    this._phase = 'idle';
    this._remainingMs = 0;
    this._completed = false;
    this._reason = 'cancelled';
    this.emit();
  }

  /**
   * Conclui o intervalo naturalmente quando a contagem chega a zero.
   */
  finish(): void {
    if (this._state === 'idle') return;
    this._state = 'idle';
    this._phase = 'idle';
    this._remainingMs = 0;
    this._completed = true;
    this._reason = 'finished';
    this.emit();
  }

  hasElapsed(): boolean {
    if (this._phase === 'intro') return false;
    return this.remainingMs <= 0;
  }

  progress(): number {
    if (this._durationMs <= 0 || this._phase === 'intro') return 0;
    const remaining = this.remainingMs;
    return Math.min(1, Math.max(0, 1 - remaining / this._durationMs));
  }

  private emit(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('RestTimer listener error', err);
      }
    });
  }
}
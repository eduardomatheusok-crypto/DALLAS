/**
 * Mecanismo reutilizável de contagem regressiva para descanso/intervalos.
 *
 * A contagem é calculada a partir de timestamps reais (`Date.now()`), não de
 * decrementos por tick. Assim o tempo permanece correto mesmo se o JavaScript
 * for suspenso (tela bloqueada, app em segundo plano, ticks perdidos).
 *
 * Este arquivo NÃO conhece técnicas avançadas nem regras de treino: ele apenas
 * executa intervalos. As regras (duração, próxima etapa, pausa curta vs normal)
 * ficam na camada de plano de intervalo (TimerPlan, fase 2).
 */

export type RestTimerState = 'idle' | 'running' | 'paused';
export type RestTimerReason = 'finished' | 'skipped' | 'cancelled';

type Listener = () => void;

const EPS_MS = 120;

export class RestTimer {
  private _state: RestTimerState = 'idle';
  private _durationMs = 0;
  private _endAt: number | null = null;
  private _remainingMs = 0;
  private _completed = false;
  private _reason: RestTimerReason | null = null;
  private readonly listeners = new Set<Listener>();

  get state(): RestTimerState {
    return this._state;
  }

  get durationMs(): number {
    return this._durationMs;
  }

  get remainingMs(): number {
    if (this._state === 'running' && this._endAt !== null) {
      return Math.max(0, this._endAt - Date.now());
    }
    return Math.max(0, this._remainingMs);
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

  start(durationSeconds: number): void {
    const durationMs = Math.max(0, Math.round(durationSeconds * 1000));
    this._durationMs = durationMs;
    this._endAt = Date.now() + durationMs;
    this._remainingMs = durationMs;
    this._state = durationMs <= 0 ? 'idle' : 'running';
    this._completed = false;
    this._reason = null;
    this.emit();
  }

  pause(): void {
    if (this._state !== 'running') return;
    const rem = this._endAt !== null ? Math.max(0, this._endAt - Date.now()) : 0;
    this._remainingMs = rem;
    this._state = 'paused';
    this.emit();
  }

  resume(): void {
    if (this._state !== 'paused') return;
    const remaining = Math.max(0, this._remainingMs);
    this._endAt = Date.now() + remaining;
    this._state = remaining > 0 ? 'running' : 'idle';
    this.emit();
  }

  /** Encerra o intervalo imediatamente (pelo usuário ou pelo sistema). */
  skip(): void {
    this._state = 'idle';
    this._remainingMs = 0;
    this._completed = true;
    this._reason = 'skipped';
    this.emit();
  }

  cancel(): void {
    this._state = 'idle';
    this._remainingMs = 0;
    this._completed = false;
    this._reason = 'cancelled';
    this.emit();
  }

  /**
   * Conclui o intervalo naturalmente. Chamado pelo driver de ticks quando a
   * contagem chega a zero enquanto está rodando.
   */
  finish(): void {
    if (this._state === 'idle') return;
    this._state = 'idle';
    this._remainingMs = 0;
    this._completed = true;
    this._reason = 'finished';
    this.emit();
  }

  /**
   * Converte a contagem regressiva para "IAv" mantendo o tempo total. Usado
   * para exibir progresso (ex.: barra de descanso) quando em execução.
   */
  progress(): number {
    if (this._durationMs <= 0) return 0;
    const remaining = this.remainingMs;
    return Math.min(1, Math.max(0, 1 - remaining / this._durationMs));
  }

  /** Checa se o tempo expirou naturalmente (com pequena tolerância). */
  hasElapsed(): boolean {
    return (
      this._state === 'running' &&
      this._endAt !== null &&
      Date.now() >= this._endAt - EPS_MS
    );
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}
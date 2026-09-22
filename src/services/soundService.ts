import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const beepAsset = require('../../assets/beep.wav');

let audioPlayerInstance: any = null;
let isAudioModeConfigured = false;

/**
 * Garante que a sessão de áudio do sistema permita tocar sons
 * mesmo se o dispositivo estiver em modo silencioso/vibratório.
 */
async function ensureAudioMode() {
  if (Platform.OS === 'web' || isAudioModeConfigured) return;
  try {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: true,
    });
    isAudioModeConfigured = true;
  } catch (err) {
    console.warn('[soundService] Aviso ao configurar áudio:', err);
  }
}

// Pré-carrega o asset no nativo em segundo plano logo no carregamento do módulo
if (Platform.OS !== 'web') {
  ensureAudioMode().catch(() => {});
  import('expo-audio')
    .then(({ preload }) => {
      preload(beepAsset).catch(() => {});
    })
    .catch(() => {});
}

async function getNativePlayer() {
  if (Platform.OS === 'web') return null;
  try {
    await ensureAudioMode();
    const { createAudioPlayer } = await import('expo-audio');
    if (!audioPlayerInstance) {
      audioPlayerInstance = createAudioPlayer(beepAsset);
    }
    return audioPlayerInstance;
  } catch (err) {
    console.warn('[soundService] Não foi possível carregar o player de áudio nativo:', err);
    return null;
  }
}

/**
 * Toca o som de término de série/timer e dispara feedback tátil.
 */
export async function playTimerEndSound(): Promise<void> {
  // Dispara feedback tátil imediato
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

  // Reprodução no Web via Web Audio API (sintetizador sem latência)
  if (Platform.OS === 'web') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const playTone = (freq: number, startSec: number, durationSec: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + startSec);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + startSec);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + durationSec);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + startSec);
          osc.stop(ctx.currentTime + startSec + durationSec);
        };
        // 3 beeps esportivos de finalização
        playTone(900, 0, 0.14);
        playTone(900, 0.22, 0.14);
        playTone(1200, 0.44, 0.25);
        return;
      }
    } catch {
      // fallback
    }
  }

  // Reprodução no Mobile via expo-audio
  try {
    let player = await getNativePlayer();
    if (player) {
      player.volume = 1.0;
      try {
        await player.seekTo(0);
      } catch {
        // Ignora caso o player ainda não suporte seek no momento
      }
      player.play();
    }
  } catch (err) {
    console.warn('[soundService] Erro ao tocar som do timer:', err);
    // Descarta a instância para recriar na próxima tentativa
    audioPlayerInstance = null;
    try {
      const { createAudioPlayer } = await import('expo-audio');
      const fallbackPlayer = createAudioPlayer(beepAsset);
      fallbackPlayer.volume = 1.0;
      fallbackPlayer.play();
      audioPlayerInstance = fallbackPlayer;
    } catch {
      // fallback final
    }
  }
}

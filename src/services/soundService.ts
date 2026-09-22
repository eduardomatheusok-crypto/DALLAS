import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Carrega o asset de áudio no ambiente nativo
let audioPlayerInstance: any = null;

async function getNativePlayer() {
  if (Platform.OS === 'web') return null;
  try {
    if (!audioPlayerInstance) {
      const { createAudioPlayer } = await import('expo-audio');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const beepAsset = require('../../assets/beep.wav');
      audioPlayerInstance = createAudioPlayer(beepAsset);
    }
    return audioPlayerInstance;
  } catch (err) {
    console.warn('Não foi possível carregar o player de áudio nativo', err);
    return null;
  }
}

/**
 * Toca o som de término de série/timer e dispara feedback tátil.
 */
export async function playTimerEndSound(): Promise<void> {
  // Dispara feedback tátil imediato
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

  // Reprodução no Web via Web Audio API (sintetizador puro, sem latência)
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
          gain.gain.setValueAtTime(0.2, ctx.currentTime + startSec);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + durationSec);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + startSec);
          osc.stop(ctx.currentTime + startSec + durationSec);
        };
        // 3 beeps esportivos de finalização
        playTone(900, 0, 0.14);
        playTone(900, 0.22, 0.14);
        playTone(1200, 0.44, 0.22);
        return;
      }
    } catch {
      // fallback
    }
  }

  // Reprodução no Mobile via expo-audio
  try {
    const player = await getNativePlayer();
    if (player) {
      await player.seekTo(0);
      player.play();
    }
  } catch (err) {
    console.warn('Erro ao tocar som do timer:', err);
  }
}

// Audio alert system for Afoodable Bites Admin Dashboard
// Uses Web Audio API for 100% reliable, zero-dependency, crystal-clear restaurant order chime

let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;

const SOUND_PREF_KEY = 'afoodable_admin_sound_alert_enabled';

export const isSoundAlertEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY);
    return val !== 'false'; // default is true
  } catch {
    return true;
  }
};

export const setSoundAlertEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
};

const getAudioContext = (): AudioContext => {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Plays a single two-tone restaurant bell chime (Ding-Dong)
 */
export const playChimeOnce = () => {
  if (!isSoundAlertEnabled()) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First tone: High bell (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    // Add harmonic shimmer
    const osc1Harmonic = ctx.createOscillator();
    const gain1Harmonic = ctx.createGain();
    osc1Harmonic.type = 'triangle';
    osc1Harmonic.frequency.setValueAtTime(1318.5, now);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    gain1Harmonic.gain.setValueAtTime(0.12, now);
    gain1Harmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    osc1Harmonic.connect(gain1Harmonic);
    gain1.connect(ctx.destination);
    gain1Harmonic.connect(ctx.destination);

    osc1.start(now);
    osc1Harmonic.start(now);
    osc1.stop(now + 0.6);
    osc1Harmonic.stop(now + 0.6);

    // Second tone: Lower bell (C5 - 523.25 Hz)
    const note2Start = now + 0.28;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, note2Start);

    const osc2Harmonic = ctx.createOscillator();
    const gain2Harmonic = ctx.createGain();
    osc2Harmonic.type = 'triangle';
    osc2Harmonic.frequency.setValueAtTime(1046.5, note2Start);

    gain2.gain.setValueAtTime(0.45, note2Start);
    gain2.gain.exponentialRampToValueAtTime(0.0001, note2Start + 0.9);

    gain2Harmonic.gain.setValueAtTime(0.15, note2Start);
    gain2Harmonic.gain.exponentialRampToValueAtTime(0.0001, note2Start + 0.6);

    osc2.connect(gain2);
    osc2Harmonic.connect(gain2Harmonic);
    gain2.connect(ctx.destination);
    gain2Harmonic.connect(ctx.destination);

    osc2.start(note2Start);
    osc2Harmonic.start(note2Start);
    osc2.stop(note2Start + 0.95);
    osc2Harmonic.stop(note2Start + 0.95);
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
};

/**
 * Rings repeatedly (3 times) to alert the store admin of a new incoming order
 */
export const playOrderRingtone = (repeats = 3) => {
  if (!isSoundAlertEnabled()) return;

  stopOrderRingtone();

  let count = 0;
  playChimeOnce();
  count++;

  if (count < repeats) {
    ringInterval = setInterval(() => {
      playChimeOnce();
      count++;
      if (count >= repeats) {
        stopOrderRingtone();
      }
    }, 1300);
  }
};

export const stopOrderRingtone = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};

/**
 * Test chime sound for user verification
 */
export const testOrderChime = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch {}
  playChimeOnce();
};

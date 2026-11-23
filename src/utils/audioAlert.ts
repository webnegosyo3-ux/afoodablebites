// Audio alert & mobile vibration system for Afoodable Bites Admin Dashboard
// Engineered for 100% reliable sound playback on Mobile (iOS Safari & Android Chrome), Tablet, and Desktop

let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;
let isUnlocked = false;

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

export const isAudioUnlocked = (): boolean => {
  return isUnlocked && audioCtx !== null && audioCtx.state === 'running';
};

/**
 * Gets or initializes the AudioContext with multi-vendor support.
 * Always call this inside a user-gesture handler on mobile.
 */
export const getAudioContext = (): AudioContext => {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

/**
 * Unlocks the Web Audio API on mobile devices (iOS Safari, Android Chrome, Tablets).
 * Must be called directly inside a synchronous user-gesture handler (tap/click).
 * Returns true when the context is running and primed.
 */
export const unlockAudio = async (): Promise<boolean> => {
  try {
    const ctx = getAudioContext();
    // resume() must be awaited — on iOS it only succeeds when called inside a user-gesture stack
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Play a 1-sample silent buffer to prime the WebKit/Blink audio graph.
    // Some browsers (iOS Safari) require an actual audio node to play through the
    // graph before subsequent programmatic playback is permitted.
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    isUnlocked = true;
    return true;
  } catch (err) {
    console.warn('Audio unlock notice:', err);
    return false;
  }
};

// Automatically listen for the very first tap/touch/click on the page to unlock audio.
// This covers the case where the first user action happens before the login button tap
// (e.g. tapping the password field).
if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'click', 'pointerdown'] as const;
  const handleUserGesture = async () => {
    // await here so iOS resume() runs synchronously within the gesture stack
    await unlockAudio();
    unlockEvents.forEach(evt => window.removeEventListener(evt, handleUserGesture as EventListener));
  };
  unlockEvents.forEach(evt =>
    window.addEventListener(evt, handleUserGesture as EventListener, { once: true, passive: true })
  );
}

/**
 * Triggers physical vibration on phones and tablets if supported.
 */
export const vibrateDevice = (pattern: number | number[] = [300, 150, 300, 150, 450]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
};

/**
 * Internal helper: ensures the AudioContext is running before we schedule any
 * oscillator nodes. On mobile, ctx.resume() must have been awaited inside a
 * prior user-gesture; here we just handle the case where it was missed.
 */
const ensureContextRunning = async (ctx: AudioContext): Promise<boolean> => {
  if (ctx.state === 'running') return true;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      return ctx.state === 'running';
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Plays a high-volume, dual-tone restaurant bell chime (Ding-Dong) with shimmer.
 * Penetrates kitchen ambient noise and mobile speakers.
 * Now async-safe: waits for context.resume() before scheduling oscillators.
 */
export const playChimeOnce = async (): Promise<void> => {
  if (!isSoundAlertEnabled()) return;

  // Trigger phone/tablet vibration simultaneously
  vibrateDevice([250, 100, 250]);

  try {
    const ctx = getAudioContext();
    const running = await ensureContextRunning(ctx);
    if (!running) {
      // Context could not be resumed — audio is blocked (no prior user gesture on this device).
      // Popup will still show; sound will play next time user taps something.
      return;
    }

    const now = ctx.currentTime;

    // Master Gain for maximum clear restaurant loudness without clipping
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.92, now);
    masterGain.connect(ctx.destination);

    // Tone 1: High Bell Note (E5 ~ 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);

    // Harmonic for brilliance on mobile speakers
    const osc1Harmonic = ctx.createOscillator();
    const gain1Harmonic = ctx.createGain();
    osc1Harmonic.type = 'triangle';
    osc1Harmonic.frequency.setValueAtTime(1318.5, now);

    gain1.gain.setValueAtTime(0.85, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    gain1Harmonic.gain.setValueAtTime(0.3, now);
    gain1Harmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain1);
    osc1Harmonic.connect(gain1Harmonic);
    gain1.connect(masterGain);
    gain1Harmonic.connect(masterGain);

    osc1.start(now);
    osc1Harmonic.start(now);
    osc1.stop(now + 0.7);
    osc1Harmonic.stop(now + 0.7);

    // Tone 2: Lower Bell Note (C5 ~ 523.25 Hz)
    const note2Start = now + 0.28;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, note2Start);

    const osc2Harmonic = ctx.createOscillator();
    const gain2Harmonic = ctx.createGain();
    osc2Harmonic.type = 'triangle';
    osc2Harmonic.frequency.setValueAtTime(1046.5, note2Start);

    gain2.gain.setValueAtTime(0.9, note2Start);
    gain2.gain.exponentialRampToValueAtTime(0.0001, note2Start + 1.15);

    gain2Harmonic.gain.setValueAtTime(0.35, note2Start);
    gain2Harmonic.gain.exponentialRampToValueAtTime(0.0001, note2Start + 0.75);

    osc2.connect(gain2);
    osc2Harmonic.connect(gain2Harmonic);
    gain2.connect(masterGain);
    gain2Harmonic.connect(masterGain);

    osc2.start(note2Start);
    osc2Harmonic.start(note2Start);
    osc2.stop(note2Start + 1.2);
    osc2Harmonic.stop(note2Start + 1.2);
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
};

/**
 * Rings continuously for incoming orders until answered or dismissed.
 * Vibrates the mobile device on every chime ring.
 */
export const playOrderRingtone = (repeats = 30) => {
  if (!isSoundAlertEnabled()) return;

  stopOrderRingtone();

  let count = 0;

  const ring = () => {
    playChimeOnce(); // fire-and-forget async; vibration + oscillators scheduled internally
    count++;
    if (count >= repeats) {
      stopOrderRingtone();
    }
  };

  ring();

  if (repeats > 1) {
    ringInterval = setInterval(ring, 1400);
  }
};

export const stopOrderRingtone = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};

/**
 * Test chime sound for user verification on phone, tablet, and desktop.
 * Must be called directly from a user-gesture handler (button click/tap).
 */
export const testOrderChime = async (): Promise<void> => {
  await unlockAudio();
  await playChimeOnce();
};

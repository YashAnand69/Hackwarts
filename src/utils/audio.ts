// Web Audio API Synthesizer for authentic Hogwarts sound effects

let audioCtx: AudioContext | null = null;
let isSoundEnabled = getSoundEnabled();

// Initialize or get audio context safely on user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
  try {
    localStorage.setItem("hogwarts_sound_enabled", enabled ? "true" : "false");
  } catch (e) {}
}

export function getSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem("hogwarts_sound_enabled");
    if (stored !== null) return stored === "true";
  } catch (e) {}
  return false;
}

// 1. Wand Swoosh / Spell Cast sound
export function playWandSwoosh() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(440, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

// 2. Magical Sparkle / Achievement sound
export function playMagicalSparkle() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(
        0.12,
        ctx.currentTime + idx * 0.06 + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + idx * 0.06 + 0.25,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.3);
    });
  } catch (e) {}
}

// 3. Owl Post / Message Chime
export function playOwlPostChime() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Two gentle warm bell harmonics
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

      gain.gain.setValueAtTime(0.01, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.1 + 0.4,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.45);
    });
  } catch (e) {}
}

// 4. Galleon Coin Clink
export function playGalleonClink() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

// 5. Cauldron Bubble Sound
export function playCauldronBubble() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startFreq = 200 + Math.random() * 200;
    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      startFreq * 2.5,
      ctx.currentTime + 0.08,
    );

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

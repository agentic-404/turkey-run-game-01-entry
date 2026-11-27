// All sound is synthesized with WebAudio: no audio files, no network, nothing
// licensed. Every effect is a short oscillator or noise burst built on demand.
export function createSound() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freqStart, freqEnd, duration, type, volume) {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  function noiseBurst(duration, volume) {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    try {
      const length = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(gain).connect(ctx.destination);
      source.start();
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  return {
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    // A quick gobble: three short descending chirps, the turkey's own voice.
    gobble() {
      tone(620, 520, 0.07, 'square', 0.08);
      setTimeout(() => tone(560, 430, 0.07, 'square', 0.08), 80);
      setTimeout(() => tone(500, 380, 0.09, 'square', 0.08), 160);
    },
    jump() {
      tone(300, 620, 0.14, 'sine', 0.1);
    },
    corn() {
      tone(880, 880, 0.06, 'triangle', 0.12);
      setTimeout(() => tone(1318, 1318, 0.09, 'triangle', 0.12), 60);
    },
    feather() {
      tone(523, 523, 0.08, 'triangle', 0.12);
      setTimeout(() => tone(659, 659, 0.08, 'triangle', 0.12), 80);
      setTimeout(() => tone(784, 784, 0.14, 'triangle', 0.12), 160);
    },
    // Two sharp notes: the farmer has spotted the turkey.
    spotted() {
      tone(196, 196, 0.12, 'sawtooth', 0.12);
      setTimeout(() => tone(147, 147, 0.18, 'sawtooth', 0.12), 120);
    },
    hit() {
      noiseBurst(0.18, 0.22);
      tone(160, 60, 0.22, 'sine', 0.2);
    },
    stumble() {
      tone(400, 120, 0.25, 'square', 0.07);
      noiseBurst(0.12, 0.1);
    },
    // A bright little fanfare for getting away.
    escapeFanfare() {
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => tone(freq, freq, 0.22, 'triangle', 0.14), i * 130);
      });
    },
    // A drooping slide for being caught.
    caughtSting() {
      tone(392, 370, 0.3, 'sawtooth', 0.1);
      setTimeout(() => tone(370, 349, 0.3, 'sawtooth', 0.1), 300);
      setTimeout(() => tone(349, 311, 0.3, 'sawtooth', 0.1), 600);
      setTimeout(() => tone(311, 233, 0.6, 'sawtooth', 0.1), 900);
    },
  };
}

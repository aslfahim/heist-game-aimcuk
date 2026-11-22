// Sky Vault: Penthouse Heist — tiny synthesized sounds (WebAudio only, no
// audio files, no network). One clear job: bleeps for pickup, alarm and win.

let ctx = null;

function audioCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function beep(freq, dur, type, gain) {
  const ac = audioCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain || 0.06, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch {
    // Sound is garnish; a failure must never break the game.
  }
}

export function playPickup() {
  beep(660, 0.12, 'triangle', 0.07);
  setTimeout(() => beep(990, 0.14, 'triangle', 0.07), 90);
}

export function playAlarmTick() {
  beep(220, 0.1, 'square', 0.04);
}

export function playCaught() {
  beep(180, 0.3, 'sawtooth', 0.08);
  setTimeout(() => beep(120, 0.4, 'sawtooth', 0.08), 200);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.22, 'triangle', 0.08), i * 130));
}

export function unlockAudio() {
  audioCtx();
}

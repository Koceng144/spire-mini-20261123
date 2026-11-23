// Tiny WebAudio sound effects for Spire Mini: short oscillator blips, no
// audio files. Every call is guarded so a browser without WebAudio (or a
// headless test) simply stays silent instead of throwing.

let ctx = null;
// The mute choice persists across sessions; storage may be unavailable
// (private mode, odd file origins), so every access is guarded.
const MUTE_KEY = 'spire-mini-muted';
let muted = false;
try { muted = window.localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { muted = false; }

function ensureContext() {
  if (ctx || muted) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

export function setMuted(value) {
  muted = !!value;
  try { window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* keep playing */ }
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, slideTo) {
  const ac = ensureContext();
  if (!ac || muted) return;
  try {
    if (ac.state === 'suspended') ac.resume();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    g.gain.setValueAtTime(gain || 0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(g).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch (e) {
    // Sound is decoration; never let it break the game.
  }
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.05); },
  draw() { tone(520, 0.08, 'sine', 0.04, 780); },
  play() { tone(440, 0.1, 'triangle', 0.07, 660); },
  hit() { tone(180, 0.16, 'sawtooth', 0.09, 70); },
  block() { tone(300, 0.12, 'square', 0.05, 420); },
  heal() { tone(520, 0.22, 'sine', 0.06, 880); },
  hurt() { tone(140, 0.2, 'sawtooth', 0.09, 60); },
  buff() { tone(392, 0.18, 'triangle', 0.06, 587); },
  win() { tone(523, 0.3, 'triangle', 0.08); setTimeout(() => tone(659, 0.3, 'triangle', 0.08), 120); setTimeout(() => tone(784, 0.45, 'triangle', 0.09), 240); },
  lose() { tone(330, 0.4, 'sine', 0.08, 165); },
  reward() { tone(740, 0.16, 'triangle', 0.07, 1108); },
};

// Seeded random source for Spire Mini. A tiny mulberry32 generator keeps
// every run reproducible: the same seed shuffles the same deck and picks
// the same rewards, which the automated tests and the screenshot staging
// both rely on.

export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

// Pick n distinct items from a list (reward choices never repeat a card).
export function pickDistinct(list, n, rng) {
  const pool = shuffle(list, rng);
  return pool.slice(0, Math.min(n, pool.length));
}

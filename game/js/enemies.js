// Enemy definitions for Spire Mini: three regular foes and one boss, each
// with its own move pattern. A move is one of:
//   { kind: 'attack', amount }  hit the player for amount (+ enemy Strength)
//   { kind: 'defend', amount }  gain that much Block
//   { kind: 'buff', amount }    gain that much Strength
// The battle engine walks the pattern in order and shows the next move as
// the enemy's intent, so the player can always read and counter it.

export const ENEMIES = [
  {
    id: 'moss-imp',
    name: 'Moss Imp',
    title: 'Floor 1 · Normal',
    maxHp: 28,
    hue: 95,
    glyph: 'imp',
    blurb: 'A squat imp grown over with moss. It pokes, then hides.',
    pattern: [
      { kind: 'attack', amount: 6 },
      { kind: 'attack', amount: 8 },
      { kind: 'defend', amount: 6 },
      { kind: 'attack', amount: 6 },
    ],
  },
  {
    id: 'candle-acolyte',
    name: 'Candle Acolyte',
    title: 'Floor 1 · Normal',
    maxHp: 25,
    hue: 35,
    glyph: 'acolyte',
    blurb: 'A robed acolyte who feeds its candle, then strikes harder.',
    pattern: [
      { kind: 'buff', amount: 2 },
      { kind: 'attack', amount: 5 },
      { kind: 'attack', amount: 7 },
      { kind: 'defend', amount: 5 },
    ],
  },
  {
    id: 'thorn-brute',
    name: 'Thorn Brute',
    title: 'Floor 2 · Elite',
    maxHp: 50,
    hue: 150,
    glyph: 'brute',
    blurb: 'A wall of bark and thorn. Its blows land like falling trees.',
    pattern: [
      { kind: 'attack', amount: 10 },
      { kind: 'buff', amount: 3 },
      { kind: 'attack', amount: 12 },
      { kind: 'defend', amount: 10 },
      { kind: 'attack', amount: 10 },
    ],
  },
  {
    id: 'lantern-warden',
    name: 'Lantern Warden',
    title: 'Floor 3 · Boss',
    maxHp: 78,
    hue: 275,
    glyph: 'warden',
    blurb: 'Keeper of the last lantern. It guards the top of the spire.',
    pattern: [
      { kind: 'attack', amount: 9 },
      { kind: 'defend', amount: 12 },
      { kind: 'attack', amount: 14 },
      { kind: 'buff', amount: 3 },
      { kind: 'attack', amount: 16 },
    ],
  },
];

const BY_ID = new Map(ENEMIES.map((e) => [e.id, e]));

export function enemyDef(id) {
  const def = BY_ID.get(id);
  if (!def) throw new Error('unknown enemy: ' + id);
  return def;
}

// The run's three floors: a normal foe, the elite, then the boss. Floor 1
// picks between the two normal foes with the run's random source.
export function floorEnemy(floor, rng) {
  if (floor === 1) return rng() < 0.5 ? enemyDef('moss-imp') : enemyDef('candle-acolyte');
  if (floor === 2) return enemyDef('thorn-brute');
  return enemyDef('lantern-warden');
}

export function intentText(move, strength) {
  if (!move) return '';
  if (move.kind === 'attack') return 'Attack ' + (move.amount + strength);
  if (move.kind === 'defend') return 'Defend ' + move.amount;
  if (move.kind === 'buff') return 'Buff +' + move.amount + ' Str';
  return '';
}

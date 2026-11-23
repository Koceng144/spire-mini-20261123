// Card definitions for Spire Mini. Every card is plain data: a cost, a type
// (attack, skill or power), a rarity, a short rules text for the card face,
// and an effects object that battle.js interprets. Each card also carries
// its upgraded version as a set of field overrides, so an upgraded copy is
// the same card with stronger numbers and a "+" on its name.
//
// Effect keys battle.js understands:
//   damage (per hit), hits, block, draw, energy, strength, dexterity,
//   vulnerable, weak, burn, heal, thorns, regen, turnBlock, turnDraw,
//   selfDamage, exhaust (card leaves the battle after play)

export const CARD_TYPES = {
  attack: { label: 'Attack', color: '#e4572e', shape: 'diamond' },
  skill: { label: 'Skill', color: '#2e86ab', shape: 'circle' },
  power: { label: 'Power', color: '#8e44ad', shape: 'triangle' },
};

const CARDS = [
  // ---- Starter cards (in the starting deck, never offered as rewards) ----
  {
    id: 'jab', name: 'Lantern Jab', type: 'attack', cost: 1, rarity: 'starter',
    text: 'Deal 6 damage.',
    effects: { damage: 6 },
    upgraded: { text: 'Deal 9 damage.', effects: { damage: 9 } },
  },
  {
    id: 'guard', name: 'Guard Stance', type: 'skill', cost: 1, rarity: 'starter',
    text: 'Gain 5 Block.',
    effects: { block: 5 },
    upgraded: { text: 'Gain 8 Block.', effects: { block: 8 } },
  },
  {
    id: 'flare', name: 'Flare Toss', type: 'attack', cost: 1, rarity: 'starter',
    text: 'Deal 4 damage. Draw 1 card.',
    effects: { damage: 4, draw: 1 },
    upgraded: { text: 'Deal 6 damage. Draw 1 card.', effects: { damage: 6, draw: 1 } },
  },

  // ---- Reward pool: attacks ----
  {
    id: 'heavy-blow', name: 'Heavy Blow', type: 'attack', cost: 2, rarity: 'common',
    text: 'Deal 14 damage.',
    effects: { damage: 14 },
    upgraded: { text: 'Deal 19 damage.', effects: { damage: 19 } },
  },
  {
    id: 'twin-fang', name: 'Twin Fang', type: 'attack', cost: 1, rarity: 'common',
    text: 'Deal 4 damage twice.',
    effects: { damage: 4, hits: 2 },
    upgraded: { text: 'Deal 6 damage twice.', effects: { damage: 6, hits: 2 } },
  },
  {
    id: 'piercing-bolt', name: 'Piercing Bolt', type: 'attack', cost: 1, rarity: 'common',
    text: 'Deal 8 damage. Apply 1 Vulnerable.',
    effects: { damage: 8, vulnerable: 1 },
    upgraded: { text: 'Deal 10 damage. Apply 2 Vulnerable.', effects: { damage: 10, vulnerable: 2 } },
  },
  {
    id: 'ember-arc', name: 'Ember Arc', type: 'attack', cost: 1, rarity: 'common',
    text: 'Deal 7 damage. Apply 2 Burn.',
    effects: { damage: 7, burn: 2 },
    upgraded: { text: 'Deal 9 damage. Apply 3 Burn.', effects: { damage: 9, burn: 3 } },
  },
  {
    id: 'reckless-swing', name: 'Reckless Swing', type: 'attack', cost: 0, rarity: 'common',
    text: 'Deal 5 damage. Take 2 damage.',
    effects: { damage: 5, selfDamage: 2 },
    upgraded: { text: 'Deal 8 damage. Take 2 damage.', effects: { damage: 8, selfDamage: 2 } },
  },
  {
    id: 'flurry', name: 'Flurry', type: 'attack', cost: 2, rarity: 'uncommon',
    text: 'Deal 3 damage 3 times.',
    effects: { damage: 3, hits: 3 },
    upgraded: { text: 'Deal 4 damage 4 times.', effects: { damage: 4, hits: 4 } },
  },
  {
    id: 'executioner', name: 'Executioner', type: 'attack', cost: 3, rarity: 'rare',
    text: 'Deal 24 damage.',
    effects: { damage: 24 },
    upgraded: { text: 'Deal 32 damage.', effects: { damage: 32 } },
  },

  // ---- Reward pool: skills ----
  {
    id: 'iron-stance', name: 'Iron Stance', type: 'skill', cost: 1, rarity: 'common',
    text: 'Gain 8 Block.',
    effects: { block: 8 },
    upgraded: { text: 'Gain 12 Block.', effects: { block: 12 } },
  },
  {
    id: 'quick-step', name: 'Quick Step', type: 'skill', cost: 0, rarity: 'common',
    text: 'Gain 3 Block. Draw 1 card.',
    effects: { block: 3, draw: 1 },
    upgraded: { text: 'Gain 6 Block. Draw 1 card.', effects: { block: 6, draw: 1 } },
  },
  {
    id: 'battle-focus', name: 'Battle Focus', type: 'skill', cost: 1, rarity: 'common',
    text: 'Draw 2 cards.',
    effects: { draw: 2 },
    upgraded: { text: 'Draw 3 cards.', effects: { draw: 3 } },
  },
  {
    id: 'second-wind', name: 'Second Wind', type: 'skill', cost: 1, rarity: 'uncommon',
    text: 'Heal 5 HP. Exhaust.',
    effects: { heal: 5, exhaust: true },
    upgraded: { text: 'Heal 9 HP. Exhaust.', effects: { heal: 9, exhaust: true } },
  },
  {
    id: 'adrenaline', name: 'Adrenaline', type: 'skill', cost: 0, rarity: 'uncommon',
    text: 'Gain 1 Energy. Exhaust.',
    effects: { energy: 1, exhaust: true },
    upgraded: { text: 'Gain 2 Energy. Exhaust.', effects: { energy: 2, exhaust: true } },
  },
  {
    id: 'smoke-bomb', name: 'Smoke Bomb', type: 'skill', cost: 1, rarity: 'common',
    text: 'Apply 2 Weak.',
    effects: { weak: 2 },
    upgraded: { text: 'Apply 3 Weak.', effects: { weak: 3 } },
  },
  {
    id: 'venom-flask', name: 'Venom Flask', type: 'skill', cost: 1, rarity: 'common',
    text: 'Apply 4 Burn.',
    effects: { burn: 4 },
    upgraded: { text: 'Apply 7 Burn.', effects: { burn: 7 } },
  },
  {
    id: 'bulwark', name: 'Bulwark', type: 'skill', cost: 2, rarity: 'uncommon',
    text: 'Gain 15 Block.',
    effects: { block: 15 },
    upgraded: { text: 'Gain 21 Block.', effects: { block: 21 } },
  },

  // ---- Reward pool: powers (stay in play for the rest of the battle) ----
  {
    id: 'might', name: 'Might', type: 'power', cost: 1, rarity: 'uncommon',
    text: 'Gain 2 Strength.',
    effects: { strength: 2 },
    upgraded: { text: 'Gain 3 Strength.', effects: { strength: 3 } },
  },
  {
    id: 'agility', name: 'Agility', type: 'power', cost: 1, rarity: 'uncommon',
    text: 'Gain 2 Dexterity.',
    effects: { dexterity: 2 },
    upgraded: { text: 'Gain 3 Dexterity.', effects: { dexterity: 3 } },
  },
  {
    id: 'thorn-mail', name: 'Thorn Mail', type: 'power', cost: 1, rarity: 'common',
    text: 'Gain 3 Thorns.',
    effects: { thorns: 3 },
    upgraded: { text: 'Gain 5 Thorns.', effects: { thorns: 5 } },
  },
  {
    id: 'regrowth', name: 'Regrowth', type: 'power', cost: 2, rarity: 'rare',
    text: 'Heal 2 HP at the start of your turn.',
    effects: { regen: 2 },
    upgraded: { text: 'Heal 3 HP at the start of your turn.', effects: { regen: 3 } },
  },
  {
    id: 'lantern-glow', name: 'Lantern Glow', type: 'power', cost: 1, rarity: 'rare',
    text: 'Gain 3 Block at the start of your turn.',
    effects: { turnBlock: 3 },
    upgraded: { text: 'Gain 5 Block at the start of your turn.', effects: { turnBlock: 5 } },
  },
  {
    id: 'keen-eye', name: 'Keen Eye', type: 'power', cost: 2, rarity: 'rare',
    text: 'Draw 1 extra card each turn.',
    effects: { turnDraw: 1 },
    upgraded: { text: 'Draw 2 extra cards each turn.', effects: { turnDraw: 2 } },
  },
];

// One icon per card, chosen by what the card does — never one generic
// glyph per type. Attacks differ by weapon (dagger, hammer, fangs, bolt,
// flame, swirl, slashes, axe); block is a shield family; burn is flame;
// debuffs are smoke/flask; draw is a card; thorns are thorns; strength is
// a rising arrow. render.js turns these names into inline SVG.
const CARD_ICONS = {
  'jab': 'dagger',
  'guard': 'shield',
  'flare': 'spark',
  'heavy-blow': 'hammer',
  'twin-fang': 'fangs',
  'piercing-bolt': 'bolt',
  'ember-arc': 'flame',
  'reckless-swing': 'swirl',
  'flurry': 'slashes',
  'executioner': 'axe',
  'iron-stance': 'shield-iron',
  'quick-step': 'boot',
  'battle-focus': 'cards',
  'second-wind': 'cross',
  'adrenaline': 'lightning',
  'smoke-bomb': 'smoke',
  'venom-flask': 'flask',
  'bulwark': 'wall',
  'might': 'arrow-up',
  'agility': 'feather',
  'thorn-mail': 'thorns',
  'regrowth': 'sprout',
  'lantern-glow': 'lantern',
  'keen-eye': 'eye',
};
for (const c of CARDS) c.icon = CARD_ICONS[c.id];

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function cardDef(id) {
  const def = BY_ID.get(id);
  if (!def) throw new Error('unknown card: ' + id);
  return def;
}

// A card instance in a deck or hand: { id, upgraded } plus a unique uid so
// the renderer can track it across re-renders.
let nextUid = 1;
export function makeCard(id, upgraded = false) {
  cardDef(id);
  return { uid: nextUid++, id, upgraded: !!upgraded };
}

// Resolve an instance to the numbers the battle engine and the card face
// use: base definition with the upgraded overrides applied when upgraded.
export function resolveCard(instance) {
  const def = cardDef(instance.id);
  if (!instance.upgraded) {
    return { ...def, upgraded: false, displayName: def.name };
  }
  const up = def.upgraded || {};
  return {
    ...def,
    ...up,
    effects: { ...def.effects, ...(up.effects || {}) },
    upgraded: true,
    displayName: def.name + '+',
  };
}

export function starterDeck() {
  const deck = [];
  for (let i = 0; i < 4; i++) deck.push(makeCard('jab'));
  for (let i = 0; i < 4; i++) deck.push(makeCard('guard'));
  for (let i = 0; i < 2; i++) deck.push(makeCard('flare'));
  return deck;
}

export function rewardPool() {
  return CARDS.filter((c) => c.rarity !== 'starter');
}

export function allCards() {
  return CARDS.slice();
}

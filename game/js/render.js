// Rendering for Spire Mini: turns battle state into DOM. Cards, the enemy
// portrait (small original inline-SVG critters), HP bars, status chips and
// the floating damage numbers all live here. The engine in battle.js knows
// nothing about the DOM; this file only reads state and events.

import { resolveCard, makeCard, CARD_TYPES } from './cards.js';
import { currentIntent } from './battle.js';
import { intentText } from './enemies.js';

const $ = (id) => document.getElementById(id);

export function showScreen(name) {
  for (const id of ['title', 'battle', 'reward', 'upgrade', 'win', 'lose']) {
    $('screen-' + id).classList.toggle('hidden', id !== name);
  }
}

// --- Original SVG art -------------------------------------------------------

// One small original SVG per effect icon (names come from cards.js).
// Every card shows what it does: weapons for attacks, shields for block,
// flame for burn, smoke/flask for debuffs, a card for draw, thorns for
// thorns, a rising arrow for strength — powers never share one glyph.
const ICONS = {
  dagger: '<path d="M12 28 L28 8 L32 12 L18 30 Z" fill="#aeb8cc" stroke="#0d0a24" stroke-width="2"/><rect x="7" y="26" width="11" height="5" rx="2" transform="rotate(-45 12 28)" fill="#7a4a21" stroke="#0d0a24" stroke-width="1.6"/>',
  hammer: '<rect x="8" y="6" width="22" height="11" rx="2" fill="#8a93a6" stroke="#0d0a24" stroke-width="2"/><rect x="17" y="16" width="6" height="18" rx="2" fill="#7a4a21" stroke="#0d0a24" stroke-width="1.8"/>',
  fangs: '<path d="M10 6 L16 6 L13 24 Z" fill="#f5efdd" stroke="#0d0a24" stroke-width="2"/><path d="M24 6 L30 6 L27 24 Z" fill="#f5efdd" stroke="#0d0a24" stroke-width="2"/><path d="M8 30 Q20 24 32 30" stroke="#0d0a24" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  bolt: '<path d="M8 32 L26 14" stroke="#7a4a21" stroke-width="4" stroke-linecap="round"/><path d="M24 6 L34 6 L34 16 L27 13 Z" fill="#aeb8cc" stroke="#0d0a24" stroke-width="2"/><path d="M8 32 L6 24 M8 32 L16 34" stroke="#e4572e" stroke-width="3.5" stroke-linecap="round"/>',
  flame: '<path d="M20 4 C24 12 30 15 30 24 A10 10 0 1 1 10 24 C10 17 14 14 16 9 C18 13 20 14 20 14 C20 10 20 7 20 4 Z" fill="#ff8c42" stroke="#0d0a24" stroke-width="2"/><path d="M20 18 C22 21 24 22 24 26 A4 4 0 1 1 16 26 C16 23 18 21 20 18 Z" fill="#ffd23f"/>',
  spark: '<path d="M20 4 L23 16 L36 20 L23 24 L20 36 L17 24 L4 20 L17 16 Z" fill="#ffd23f" stroke="#0d0a24" stroke-width="2"/>',
  swirl: '<path d="M30 12 A12 12 0 1 0 32 24" stroke="#e4572e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M24 5 L33 6 L31 15 Z" fill="#e4572e" stroke="#0d0a24" stroke-width="1.6"/>',
  slashes: '<path d="M10 30 L22 10 M18 32 L30 12 M26 34 L36 16" stroke="#aeb8cc" stroke-width="4" stroke-linecap="round"/><path d="M10 30 L22 10 M18 32 L30 12 M26 34 L36 16" stroke="#0d0a24" stroke-width="1" stroke-linecap="round" opacity=".35"/>',
  axe: '<rect x="17" y="14" width="6" height="22" rx="2" transform="rotate(18 20 25)" fill="#7a4a21" stroke="#0d0a24" stroke-width="1.8"/><path d="M14 6 C24 2 32 6 34 14 C28 16 22 15 18 12 C15 10 14 8 14 6 Z" fill="#aeb8cc" stroke="#0d0a24" stroke-width="2"/>',
  shield: '<path d="M20 4 L34 9 V20 C34 29 27 34 20 37 C13 34 6 29 6 20 V9 Z" fill="#9fd4ec" stroke="#0d0a24" stroke-width="2"/><path d="M20 9 V32" stroke="#0d0a24" stroke-width="2"/>',
  'shield-iron': '<path d="M20 4 L34 9 V20 C34 29 27 34 20 37 C13 34 6 29 6 20 V9 Z" fill="#7fb6d9" stroke="#0d0a24" stroke-width="2"/><path d="M20 9 V32 M9 16 H31" stroke="#0d0a24" stroke-width="2"/><circle cx="20" cy="16" r="2.6" fill="#0d0a24"/>',
  wall: '<rect x="6" y="10" width="28" height="22" rx="2" fill="#b08968" stroke="#0d0a24" stroke-width="2"/><path d="M6 17 H34 M6 25 H34 M15 10 V17 M25 17 V25 M15 25 V32" stroke="#0d0a24" stroke-width="1.8"/>',
  boot: '<path d="M12 4 H24 V20 L34 26 V34 H12 Z" fill="#58b368" stroke="#0d0a24" stroke-width="2"/><path d="M12 30 H34" stroke="#0d0a24" stroke-width="2"/>',
  cards: '<rect x="12" y="8" width="18" height="24" rx="3" transform="rotate(10 21 20)" fill="#f5efdd" stroke="#0d0a24" stroke-width="2"/><rect x="8" y="9" width="18" height="24" rx="3" transform="rotate(-8 17 21)" fill="#ffd23f" stroke="#0d0a24" stroke-width="2"/>',
  cross: '<path d="M16 6 H24 V16 H34 V24 H24 V34 H16 V24 H6 V16 H16 Z" fill="#7dd87d" stroke="#0d0a24" stroke-width="2"/>',
  lightning: '<path d="M23 3 L10 22 H18 L15 37 L30 16 H21 Z" fill="#ffd23f" stroke="#0d0a24" stroke-width="2"/>',
  smoke: '<circle cx="15" cy="24" r="8" fill="#b9b2d9" stroke="#0d0a24" stroke-width="2"/><circle cx="25" cy="19" r="9" fill="#cfc8ec" stroke="#0d0a24" stroke-width="2"/><circle cx="27" cy="27" r="6" fill="#b9b2d9" stroke="#0d0a24" stroke-width="2"/>',
  flask: '<path d="M16 5 H24 M18 5 V14 L10 30 A3 3 0 0 0 13 34 H27 A3 3 0 0 0 30 30 L22 14 V5" fill="#c2f2c2" stroke="#0d0a24" stroke-width="2"/><path d="M20 20 C22 23 23 24 23 26 A3 3 0 1 1 17 26 C17 24 18 23 20 20 Z" fill="#58b368"/>',
  'arrow-up': '<path d="M20 4 L32 18 H25 V36 H15 V18 H8 Z" fill="#e4572e" stroke="#0d0a24" stroke-width="2"/>',
  feather: '<path d="M30 5 C16 8 8 18 8 32 L10 34 C24 32 32 20 30 5 Z" fill="#9fd4ec" stroke="#0d0a24" stroke-width="2"/><path d="M10 32 C16 22 22 14 28 8" stroke="#0d0a24" stroke-width="1.8" fill="none"/>',
  thorns: '<path d="M20 3 L23 12 L32 7 L27 16 L36 16 L28 22 L35 28 L26 27 L28 36 L20 29 L12 36 L14 27 L5 28 L12 22 L4 16 L13 16 L8 7 L17 12 Z" fill="#58b368" stroke="#0d0a24" stroke-width="1.8"/>',
  sprout: '<path d="M20 36 V22" stroke="#0d0a24" stroke-width="3" stroke-linecap="round"/><path d="M20 22 C20 14 14 10 6 10 C6 18 12 22 20 22 Z" fill="#7dd87d" stroke="#0d0a24" stroke-width="2"/><path d="M20 18 C20 11 25 7 33 7 C33 14 28 18 20 18 Z" fill="#58b368" stroke="#0d0a24" stroke-width="2"/>',
  lantern: '<path d="M16 8 H24 M20 8 V5" stroke="#0d0a24" stroke-width="2.5"/><rect x="11" y="10" width="18" height="22" rx="3" fill="#2b2118" stroke="#0d0a24" stroke-width="2"/><rect x="15" y="14" width="10" height="14" rx="2" fill="#ffd23f"/><circle cx="20" cy="21" r="3" fill="#fff3c4"/>',
  eye: '<path d="M4 20 C10 10 16 7 20 7 C24 7 30 10 36 20 C30 30 24 33 20 33 C16 33 10 30 4 20 Z" fill="#f5efdd" stroke="#0d0a24" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#8e44ad" stroke="#0d0a24" stroke-width="2"/><circle cx="20" cy="20" r="2.4" fill="#0d0a24"/>',
};

function cardIcon(card) {
  const body = ICONS[card.icon] || ICONS.spark;
  return '<svg viewBox="0 0 40 40">' + body + '</svg>';
}

function enemySvg(glyph, hue) {
  const body = `hsl(${hue} 55% 45%)`;
  const dark = `hsl(${hue} 60% 30%)`;
  if (glyph === 'imp') {
    return `<svg viewBox="0 0 120 120"><path d="M28 34 L18 12 L40 22 Z" fill="${dark}"/><path d="M92 34 L102 12 L80 22 Z" fill="${dark}"/><ellipse cx="60" cy="68" rx="42" ry="40" fill="${body}"/><ellipse cx="60" cy="82" rx="24" ry="20" fill="${dark}" opacity=".55"/><circle cx="44" cy="60" r="6" fill="#0d0a24"/><circle cx="76" cy="60" r="6" fill="#0d0a24"/><path d="M48 78 Q60 86 72 78" stroke="#0d0a24" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="34" cy="40" r="7" fill="${dark}"/><circle cx="86" cy="38" r="9" fill="${dark}"/><circle cx="60" cy="30" r="6" fill="${dark}"/></svg>`;
  }
  if (glyph === 'acolyte') {
    return `<svg viewBox="0 0 120 120"><path d="M60 8 C34 8 26 34 26 58 L22 112 L98 112 L94 58 C94 34 86 8 60 8 Z" fill="${body}"/><ellipse cx="60" cy="52" rx="22" ry="24" fill="#0d0a24"/><circle cx="52" cy="50" r="3.5" fill="#ffd23f"/><circle cx="68" cy="50" r="3.5" fill="#ffd23f"/><rect x="54" y="84" width="12" height="18" rx="2" fill="#f5efdd"/><path d="M60 70 C55 78 55 82 60 86 C65 82 65 78 60 70 Z" fill="#ffb340"/></svg>`;
  }
  if (glyph === 'brute') {
    return `<svg viewBox="0 0 120 120"><path d="M16 112 L24 44 Q60 22 96 44 L104 112 Z" fill="${body}"/><path d="M24 44 L10 26 L34 34 Z" fill="${dark}"/><path d="M96 44 L110 26 L86 34 Z" fill="${dark}"/><path d="M60 30 L52 14 L68 14 Z" fill="${dark}"/><circle cx="46" cy="56" r="5" fill="#0d0a24"/><circle cx="74" cy="56" r="5" fill="#0d0a24"/><path d="M44 76 L52 70 L60 76 L68 70 L76 76" stroke="#0d0a24" stroke-width="4" fill="none"/><path d="M30 96 Q60 86 90 96" stroke="${dark}" stroke-width="6" fill="none"/></svg>`;
  }
  return `<svg viewBox="0 0 120 120"><path d="M38 112 L44 52 L76 52 L82 112 Z" fill="${body}"/><rect x="42" y="12" width="36" height="42" rx="7" fill="#0d0a24" stroke="#ffb340" stroke-width="4"/><rect x="50" y="20" width="20" height="26" rx="4" fill="#ffd23f"/><circle cx="60" cy="33" r="6" fill="#fff3c4"/><path d="M60 4 V12" stroke="#ffb340" stroke-width="4"/><circle cx="60" cy="4" r="3" fill="#ffb340"/><path d="M44 66 L24 88 M76 66 L96 88" stroke="${dark}" stroke-width="9" stroke-linecap="round"/></svg>`;
}

// --- Cards ------------------------------------------------------------------

export function cardElement(instance, opts = {}) {
  const card = resolveCard(instance);
  const type = CARD_TYPES[card.type];
  const el = document.createElement('div');
  el.className = 'card type-' + card.type + (card.upgraded ? ' upgraded' : '');
  el.dataset.uid = String(instance.uid);
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', card.displayName + ', cost ' + card.cost + '. ' + card.text);
  el.innerHTML =
    '<div class="card-top"><div class="cost">' + card.cost + '</div>' +
    '<div class="card-name">' + card.displayName + '</div></div>' +
    '<div class="card-art" style="background:' + type.color + '33">' + cardIcon(card) + '</div>' +
    '<div class="card-type" style="color:' + type.color + '">' +
    '<span class="shape ' + type.shape + '" style="background:' + type.color + ';color:' + type.color + '"></span>' +
    type.label + '</div>' +
    '<div class="card-text">' + card.text + '</div>' +
    (card.upgraded ? '<div class="up-badge">UPGRADED</div>' : '') +
    (opts.keyHint ? '<div class="card-key">' + opts.keyHint + '</div>' : '');
  return el;
}

// The title screen's poster fan: four real cards (an attack, a burn
// attack, a block skill and a power) rendered from the same card data
// and cardElement the game uses, fanned big enough to read at a glance.
// They are decoration only — not focusable, not playable.
export function renderSampleCards(el) {
  const ids = ['jab', 'ember-arc', 'iron-stance', 'keen-eye'];
  const angles = [-8, -3, 3, 8];
  const lifts = [10, 0, 0, 10];
  const layers = [2, 3, 3, 2];
  el.querySelectorAll('.card').forEach((c) => c.remove());
  ids.forEach((id, i) => {
    const c = cardElement(makeCard(id));
    c.removeAttribute('tabindex');
    c.removeAttribute('role');
    c.style.setProperty('--fan', angles[i] + 'deg');
    c.style.setProperty('--lift', lifts[i] + 'px');
    c.style.zIndex = String(layers[i]);
    el.appendChild(c);
  });
}

// --- Battle screen ------------------------------------------------------------

function statusChips(combatant, isPlayer) {
  const chips = [];
  if (combatant.strength > 0) chips.push('<span class="status-chip good">💪 Str +' + combatant.strength + '</span>');
  if (isPlayer && combatant.dexterity > 0) chips.push('<span class="status-chip good">🦶 Dex +' + combatant.dexterity + '</span>');
  if (isPlayer && combatant.thorns > 0) chips.push('<span class="status-chip good">🌵 Thorns ' + combatant.thorns + '</span>');
  if (isPlayer && combatant.regen > 0) chips.push('<span class="status-chip good">🌿 Regen ' + combatant.regen + '</span>');
  if (!isPlayer && combatant.burn > 0) chips.push('<span class="status-chip bad">🔥 Burn ' + combatant.burn + '</span>');
  if (combatant.vulnerable > 0) chips.push('<span class="status-chip bad">🎯 Vulnerable ' + combatant.vulnerable + '</span>');
  if (combatant.weak > 0) chips.push('<span class="status-chip bad">💨 Weak ' + combatant.weak + '</span>');
  return chips.join('');
}

export function renderBattle(battle, run, opts = {}) {
  const p = battle.player;
  const e = battle.enemy;

  $('floor-banner').textContent = 'Floor ' + run.floor + ' of 3';
  $('enemy-zone').classList.toggle('acting', battle.phase === 'enemy');
  const turnBanner = $('turn-banner');
  turnBanner.textContent = battle.phase === 'enemy' ? 'Enemy turn…' : 'Your turn · ' + battle.turn;
  turnBanner.classList.toggle('enemy', battle.phase === 'enemy');

  $('enemy-portrait').innerHTML = enemySvg(e.def.glyph, e.def.hue);
  $('enemy-name').textContent = e.def.name;
  $('enemy-hp-fill').style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
  $('enemy-hp-text').textContent = e.hp + ' / ' + e.maxHp;
  const eBlock = $('enemy-block');
  eBlock.textContent = '🛡 ' + e.block;
  eBlock.classList.toggle('hidden', e.block <= 0);
  $('enemy-status').innerHTML = statusChips(e, false);

  const intent = currentIntent(battle);
  const badge = $('intent-badge');
  const icons = { attack: '⚔', defend: '🛡', buff: '⬆' };
  badge.textContent = (icons[intent.kind] || '') + ' ' + intentText(intent, e.strength);
  badge.className = 'intent-badge ' + intent.kind;

  $('player-hp-fill').style.width = Math.max(0, (p.hp / p.maxHp) * 100) + '%';
  $('player-hp-text').textContent = p.hp + ' / ' + p.maxHp;
  $('player-block').textContent = String(p.block);
  $('pile-counts').textContent = battle.drawPile.length + ' / ' + battle.discardPile.length;
  $('player-status').innerHTML = statusChips(p, true);

  const pips = $('energy-pips');
  pips.innerHTML = '';
  for (let i = 0; i < p.maxEnergy; i++) {
    const pip = document.createElement('div');
    pip.className = 'energy-pip' + (i < p.energy ? '' : ' spent');
    pips.appendChild(pip);
  }

  const hand = $('hand');
  hand.innerHTML = '';
  battle.hand.forEach((instance, i) => {
    const el = cardElement(instance, { keyHint: i + 1 });
    const playable = battle.phase === 'player' && resolveCard(instance).cost <= p.energy;
    if (!playable) el.classList.add('unplayable');
    if (opts.dealt) {
      el.classList.add('dealing');
      el.style.animationDelay = (i * 70) + 'ms';
    }
    el.dataset.index = String(i);
    hand.appendChild(el);
  });
  layoutHand(hand);

  $('btn-end-turn').disabled = battle.phase !== 'player';
}

// Fit the hand inside its container: shrink cards first (down to a readable
// floor), then overlap only as much as needed. At phone widths a normal
// 5-card hand keeps name, cost and effect text fully visible; the fan
// rotation rides on a CSS variable so the hover/press lift still applies.
export function layoutHand(hand) {
  const cards = [...hand.children];
  const n = cards.length;
  if (!n) return;
  // The hand may fan wider than its 500px column on wide screens (up to
  // the 560px app width), matching the original desktop look. Fit inside
  // the padded content box: the horizontal padding absorbs the fan
  // rotation and hover lift of the edge cards, so they never clip at the
  // viewport edge (body overflow is hidden).
  const cs = getComputedStyle(hand);
  const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const containerW = Math.max((hand.clientWidth || 332) - padX, Math.min(560, window.innerWidth - 16) - padX);
  const BASE_W = 118, MIN_W = 78;
  let cardW = BASE_W;
  let overlap = 0;
  const total = () => n * cardW - (n - 1) * overlap;
  while (total() > containerW && cardW > MIN_W) cardW -= 2;
  if (total() > containerW && n > 1) {
    overlap = Math.ceil((n * cardW - containerW) / (n - 1));
  }
  const compact = cardW < 104;
  const mid = (n - 1) / 2;
  cards.forEach((el, i) => {
    el.style.width = cardW + 'px';
    el.style.marginLeft = i === 0 ? '0' : -overlap + 'px';
    el.classList.toggle('compact', compact);
    el.style.setProperty('--fan', ((i - mid) * (compact ? 2 : 3)) + 'deg');
    // No inline z-index: DOM order fans later cards on top, and the
    // hover/press lift (z-index 30 in CSS) must be able to win.
  });
}

// --- Floating combat numbers ---------------------------------------------------

let floaterSeq = 0;
// target: 'enemy' (default) floats over the enemy portrait; 'player'
// floats over the player's stat row, where damage/block/heal land.
export function spawnFloater(text, kind, target) {
  const zone = $(target === 'player' ? 'player-floaters' : 'floaters');
  const el = document.createElement('div');
  el.className = 'floater ' + (kind || '');
  el.textContent = text;
  const x = 38 + ((floaterSeq * 13) % 26);
  floaterSeq++;
  el.style.left = x + '%';
  el.style.top = target === 'player' ? '6%' : '34%';
  zone.appendChild(el);
  setTimeout(() => el.remove(), 1050);
}

export function shakeEnemy() {
  const zone = $('enemy-zone');
  zone.classList.remove('shake');
  void zone.offsetWidth;
  zone.classList.add('shake');
}

export function markDropTarget(on) {
  $('enemy-zone').classList.toggle('drop-target', !!on);
}

// --- Reward / upgrade / end screens ---------------------------------------------

export function renderReward(choices) {
  const wrap = $('reward-cards');
  wrap.innerHTML = '';
  choices.forEach((choice, i) => {
    const el = cardElement({ uid: 'reward-' + i, id: choice.id, upgraded: choice.upgraded });
    el.dataset.choice = String(i);
    wrap.appendChild(el);
  });
}

export function renderUpgrade(cards) {
  const wrap = $('upgrade-cards');
  wrap.innerHTML = '';
  for (const instance of cards) {
    const el = cardElement(instance);
    el.dataset.uid = String(instance.uid);
    wrap.appendChild(el);
  }
  if (cards.length === 0) {
    wrap.innerHTML = '<p class="screen-sub">Every card in your deck is already upgraded.</p>';
  }
}

// The final deck as compact chips (cost + name), grouped by type so the
// end screens show exactly what the run was built from.
export function renderDeckList(elId, run) {
  const order = { attack: 0, skill: 1, power: 2 };
  const cards = run.deck.map((c) => resolveCard(c))
    .sort((a, b) => (order[a.type] - order[b.type]) || a.displayName.localeCompare(b.displayName));
  const chips = cards.map((c) =>
    '<span class="deck-chip type-' + c.type + (c.upgraded ? ' upgraded' : '') + '">' +
    '<span class="chip-cost">' + c.cost + '</span>' + c.displayName + '</span>').join('');
  $(elId).innerHTML = '<h3>Final deck · ' + cards.length + ' cards</h3><div class="deck-chips">' + chips + '</div>';
}

export function renderStats(elId, run) {
  const s = run.stats;
  $(elId).innerHTML =
    '<div class="stat-line"><span>Floors cleared</span><b>' + s.battlesWon + ' / 3</b></div>' +
    '<div class="stat-line"><span>Cards played</span><b>' + s.cardsPlayed + '</b></div>' +
    '<div class="stat-line"><span>Damage dealt</span><b>' + s.damageDealt + '</b></div>' +
    '<div class="stat-line"><span>Turns taken</span><b>' + s.turnsTaken + '</b></div>' +
    '<div class="stat-line"><span>Final deck size</span><b>' + run.deck.length + ' cards</b></div>';
}

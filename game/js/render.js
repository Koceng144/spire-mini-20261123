// Rendering for Spire Mini: turns battle state into DOM. Cards, the enemy
// portrait (small original inline-SVG critters), HP bars, status chips and
// the floating damage numbers all live here. The engine in battle.js knows
// nothing about the DOM; this file only reads state and events.

import { resolveCard, CARD_TYPES } from './cards.js';
import { currentIntent } from './battle.js';
import { intentText } from './enemies.js';

const $ = (id) => document.getElementById(id);

export function showScreen(name) {
  for (const id of ['title', 'battle', 'reward', 'upgrade', 'win', 'lose']) {
    $('screen-' + id).classList.toggle('hidden', id !== name);
  }
}

// --- Original SVG art -------------------------------------------------------

function typeIcon(type) {
  if (type === 'attack') {
    return '<svg viewBox="0 0 40 40"><path d="M8 32 L26 8 L32 14 L14 34 Z" fill="#8a93a6" stroke="#0d0a24" stroke-width="2"/><rect x="6" y="28" width="10" height="5" rx="2" transform="rotate(-45 11 30)" fill="#7a4a21" stroke="#0d0a24" stroke-width="1.6"/></svg>';
  }
  if (type === 'skill') {
    return '<svg viewBox="0 0 40 40"><path d="M20 4 L34 9 V20 C34 29 27 34 20 37 C13 34 6 29 6 20 V9 Z" fill="#9fd4ec" stroke="#0d0a24" stroke-width="2"/><path d="M20 9 V32" stroke="#0d0a24" stroke-width="2"/></svg>';
  }
  return '<svg viewBox="0 0 40 40"><path d="M20 3 L24 15 L37 15 L27 23 L30 36 L20 28 L10 36 L13 23 L3 15 L16 15 Z" fill="#e9c46a" stroke="#0d0a24" stroke-width="2"/></svg>';
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
    '<div class="card-art" style="background:' + type.color + '33">' + typeIcon(card.type) + '</div>' +
    '<div class="card-type" style="color:' + type.color + '">' +
    '<span class="shape ' + type.shape + '" style="background:' + type.color + ';color:' + type.color + '"></span>' +
    type.label + '</div>' +
    '<div class="card-text">' + card.text + '</div>' +
    (card.upgraded ? '<div class="up-badge">UPGRADED</div>' : '') +
    (opts.keyHint ? '<div class="card-key">' + opts.keyHint + '</div>' : '');
  return el;
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
    const mid = (battle.hand.length - 1) / 2;
    el.style.transform = 'rotate(' + ((i - mid) * 3) + 'deg)';
    el.dataset.index = String(i);
    hand.appendChild(el);
  });

  $('btn-end-turn').disabled = battle.phase !== 'player';
}

// --- Floating combat numbers ---------------------------------------------------

let floaterSeq = 0;
export function spawnFloater(text, kind) {
  const zone = $('floaters');
  const el = document.createElement('div');
  el.className = 'floater ' + (kind || '');
  el.textContent = text;
  const x = 38 + ((floaterSeq * 13) % 26);
  floaterSeq++;
  el.style.left = x + '%';
  el.style.top = '34%';
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

export function renderStats(elId, run) {
  const s = run.stats;
  $(elId).innerHTML =
    '<div class="stat-line"><span>Floors cleared</span><b>' + s.battlesWon + ' / 3</b></div>' +
    '<div class="stat-line"><span>Cards played</span><b>' + s.cardsPlayed + '</b></div>' +
    '<div class="stat-line"><span>Damage dealt</span><b>' + s.damageDealt + '</b></div>' +
    '<div class="stat-line"><span>Turns taken</span><b>' + s.turnsTaken + '</b></div>' +
    '<div class="stat-line"><span>Final deck size</span><b>' + run.deck.length + ' cards</b></div>';
}

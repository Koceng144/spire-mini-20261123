// Battle engine for Spire Mini: pure turn logic with no DOM access, so the
// automated tests can drive it directly. The renderer reads the battle
// state and the event list each action returns (damage numbers, blocks,
// heals) to drive its animations.
//
// Turn shape: the player starts each turn with fresh Energy and Block,
// draws a hand, plays cards, then ends the turn. The enemy then performs
// the move it telegraphed as its intent. Burn ticks at the start of the
// afflicted side's turn; Vulnerable and Weak wear off at the end of the
// afflicted side's turn.

import { resolveCard } from './cards.js';
import { shuffle } from './random.js';

export const BASE_ENERGY = 3;
export const BASE_DRAW = 5;

export function createBattle({ deck, playerHp, maxHp, enemy, rng }) {
  const battle = {
    turn: 0,
    phase: 'player',
    player: {
      hp: playerHp, maxHp, block: 0,
      energy: BASE_ENERGY, maxEnergy: BASE_ENERGY,
      strength: 0, dexterity: 0, thorns: 0, regen: 0,
      turnBlock: 0, turnDraw: 0, vulnerable: 0, weak: 0,
    },
    enemy: {
      def: enemy, hp: enemy.maxHp, maxHp: enemy.maxHp, block: 0,
      strength: 0, vulnerable: 0, weak: 0, burn: 0, moveIndex: 0,
    },
    drawPile: shuffle(deck, rng),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    events: [],
  };
  startPlayerTurn(battle, rng);
  return battle;
}

export function currentIntent(battle) {
  const pattern = battle.enemy.def.pattern;
  return pattern[battle.enemy.moveIndex % pattern.length];
}

function emit(battle, event) {
  battle.events.push(event);
}

export function drainEvents(battle) {
  const out = battle.events;
  battle.events = [];
  return out;
}

// Damage after Strength, Weak and Vulnerable, before Block. Attackers add
// their Strength; a Weak attacker deals 25% less; a Vulnerable defender
// takes 50% more. Both modifiers floor, as the card faces promise.
export function attackDamage(base, attacker, defender) {
  let dmg = base + (attacker.strength || 0);
  if (attacker.weak > 0) dmg = Math.floor(dmg * 0.75);
  if (defender.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  return Math.max(0, dmg);
}

// Apply damage to a combatant: Block absorbs first, the rest hits HP.
// Returns { hpLost, blocked } for the renderer's floating numbers.
export function dealDamage(battle, target, amount, source) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const hpLost = amount - blocked;
  target.hp = Math.max(0, target.hp - hpLost);
  emit(battle, {
    type: 'damage', target: target === battle.enemy ? 'enemy' : 'player',
    amount, blocked, hpLost, source: source || 'attack',
  });
  if (target === battle.player && hpLost > 0 && battle.player.thorns > 0 && source === 'attack') {
    dealDamage(battle, battle.enemy, battle.player.thorns, 'thorns');
  }
  checkEnd(battle);
  return { hpLost, blocked };
}

function gainBlock(battle, who, amount) {
  const target = who === 'player' ? battle.player : battle.enemy;
  const total = amount + (who === 'player' ? battle.player.dexterity : 0);
  target.block += total;
  emit(battle, { type: 'block', target: who, amount: total });
}

function heal(battle, who, amount) {
  const target = who === 'player' ? battle.player : battle.enemy;
  const healed = Math.min(amount, target.maxHp - target.hp);
  target.hp += healed;
  if (healed > 0) emit(battle, { type: 'heal', target: who, amount: healed });
  return healed;
}

export function drawCards(battle, count, rng) {
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (battle.drawPile.length === 0) {
      if (battle.discardPile.length === 0) break;
      battle.drawPile = shuffle(battle.discardPile, rng);
      battle.discardPile = [];
      emit(battle, { type: 'reshuffle' });
    }
    battle.hand.push(battle.drawPile.pop());
    drawn++;
  }
  if (drawn > 0) emit(battle, { type: 'draw', count: drawn });
  return drawn;
}

function tickBurn(battle, who) {
  const target = who === 'player' ? battle.player : battle.enemy;
  const burn = who === 'player' ? 0 : battle.enemy.burn;
  if (burn > 0) {
    target.hp = Math.max(0, target.hp - burn);
    emit(battle, { type: 'damage', target: who, amount: burn, blocked: 0, hpLost: burn, source: 'burn' });
    if (who === 'enemy') battle.enemy.burn = Math.max(0, battle.enemy.burn - 1);
    checkEnd(battle);
  }
}

function checkEnd(battle) {
  if (battle.phase === 'won' || battle.phase === 'lost') return;
  if (battle.enemy.hp <= 0) {
    battle.phase = 'won';
    emit(battle, { type: 'enemy-died' });
  } else if (battle.player.hp <= 0) {
    battle.phase = 'lost';
    emit(battle, { type: 'player-died' });
  }
}

export function startPlayerTurn(battle, rng) {
  if (battle.phase === 'won' || battle.phase === 'lost') return;
  battle.phase = 'player';
  battle.turn += 1;
  const p = battle.player;
  p.block = 0;
  if (p.regen > 0) heal(battle, 'player', p.regen);
  if (p.turnBlock > 0) gainBlock(battle, 'player', p.turnBlock);
  p.energy = p.maxEnergy;
  drawCards(battle, BASE_DRAW + p.turnDraw, rng);
  emit(battle, { type: 'turn-start', turn: battle.turn });
}

// Play the card at handIndex. Returns true when the card was played.
// Unplayable cards (not enough Energy, battle over) return false and leave
// the state untouched, so a misclick can never softlock a run.
export function playCard(battle, handIndex, rng) {
  if (battle.phase !== 'player') return false;
  const instance = battle.hand[handIndex];
  if (!instance) return false;
  const card = resolveCard(instance);
  if (card.cost > battle.player.energy) return false;

  battle.player.energy -= card.cost;
  battle.hand.splice(handIndex, 1);
  const fx = card.effects;
  emit(battle, { type: 'play', card: instance, name: card.displayName });

  if (fx.damage) {
    const hits = fx.hits || 1;
    for (let i = 0; i < hits; i++) {
      if (battle.phase !== 'player') break;
      dealDamage(battle, battle.enemy, attackDamage(fx.damage, battle.player, battle.enemy), 'attack');
    }
  }
  if (fx.vulnerable) battle.enemy.vulnerable += fx.vulnerable;
  if (fx.weak) battle.enemy.weak += fx.weak;
  if (fx.burn) battle.enemy.burn += fx.burn;
  if (fx.block) gainBlock(battle, 'player', fx.block);
  if (fx.strength) battle.player.strength += fx.strength;
  if (fx.dexterity) battle.player.dexterity += fx.dexterity;
  if (fx.thorns) battle.player.thorns += fx.thorns;
  if (fx.regen) battle.player.regen += fx.regen;
  if (fx.turnBlock) battle.player.turnBlock += fx.turnBlock;
  if (fx.turnDraw) battle.player.turnDraw += fx.turnDraw;
  if (fx.energy) battle.player.energy += fx.energy;
  if (fx.heal) heal(battle, 'player', fx.heal);
  if (fx.draw) drawCards(battle, fx.draw, rng);
  if (fx.selfDamage) dealDamage(battle, battle.player, fx.selfDamage, 'self');

  if (fx.exhaust || card.type === 'power') battle.exhaustPile.push(instance);
  else battle.discardPile.push(instance);
  checkEnd(battle);
  return true;
}

export function canPlay(battle, instance) {
  if (battle.phase !== 'player') return false;
  return resolveCard(instance).cost <= battle.player.energy;
}

// End the player's turn: discard the hand, let the enemy perform its
// telegraphed move, then start the next player turn.
export function endPlayerTurn(battle, rng) {
  if (battle.phase !== 'player') return;
  battle.discardPile.push(...battle.hand);
  battle.hand = [];
  if (battle.player.vulnerable > 0) battle.player.vulnerable -= 1;
  if (battle.player.weak > 0) battle.player.weak -= 1;

  battle.phase = 'enemy';
  const e = battle.enemy;
  e.block = 0;
  tickBurn(battle, 'enemy');
  if (battle.phase === 'won') return;

  const move = currentIntent(battle);
  e.moveIndex += 1;
  emit(battle, { type: 'enemy-move', move });
  if (move.kind === 'attack') {
    dealDamage(battle, battle.player, attackDamage(move.amount, e, battle.player), 'attack');
  } else if (move.kind === 'defend') {
    gainBlock(battle, 'enemy', move.amount);
  } else if (move.kind === 'buff') {
    e.strength += move.amount;
    emit(battle, { type: 'buff', target: 'enemy', amount: move.amount });
  }
  if (e.vulnerable > 0) e.vulnerable -= 1;
  if (e.weak > 0) e.weak -= 1;
  if (battle.phase === 'lost' || battle.phase === 'won') return;

  startPlayerTurn(battle, rng);
}

// The deck as it stands after the battle (for the reward/upgrade screens):
// every card the player owns, wherever it currently sits.
export function collectDeck(battle) {
  return [...battle.drawPile, ...battle.hand, ...battle.discardPile, ...battle.exhaustPile];
}

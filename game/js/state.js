// Run state for Spire Mini: one climb of three floors (normal foe, elite,
// boss). The run owns the player's deck and HP between battles, rolls the
// card rewards after each win, and tracks the stats the end screens show.

import { starterDeck, rewardPool, makeCard } from './cards.js';
import { floorEnemy } from './enemies.js';
import { makeRng, pickDistinct } from './random.js';

export const MAX_HP = 50;
export const FLOORS = 3;
export const REST_HEAL = 3;

export function createRun(seed) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    floor: 1,
    playerHp: MAX_HP,
    maxHp: MAX_HP,
    deck: starterDeck(),
    stats: { battlesWon: 0, cardsPlayed: 0, damageDealt: 0, turnsTaken: 0 },
  };
}

export function currentEnemy(run) {
  return floorEnemy(run.floor, run.rng);
}

// Three distinct reward cards after a battle win. A quarter of the time an
// offered card arrives already upgraded, so a reward can be a power spike.
export function rewardChoices(run) {
  const pool = rewardPool();
  return pickDistinct(pool, 3, run.rng).map((def) => ({
    id: def.id,
    upgraded: run.rng() < 0.25,
  }));
}

export function takeReward(run, choice) {
  run.deck.push(makeCard(choice.id, choice.upgraded));
}

export function upgradeableCards(run) {
  return run.deck.filter((c) => !c.upgraded);
}

export function upgradeCard(run, uid) {
  const card = run.deck.find((c) => c.uid === uid);
  if (card && !card.upgraded) {
    card.upgraded = true;
    return true;
  }
  return false;
}

// Called after a battle is won: bank the win, rest a little, climb on.
export function advanceRun(run) {
  run.stats.battlesWon += 1;
  run.playerHp = Math.min(run.maxHp, run.playerHp + REST_HEAL);
  run.floor += 1;
  return run.floor <= FLOORS;
}

export function runFinished(run) {
  return run.floor > FLOORS;
}

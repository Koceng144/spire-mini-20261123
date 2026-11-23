// Screenshot staging for Spire Mini. Opening the game with ?shot=<name>
// (and an optional &seed=) builds a fixed, seeded state so screenshots are
// reproducible: a rich mid-battle table, the reward draft, and the two end
// screens. Normal play never passes through here.

import { createBattle, playCard, endPlayerTurn } from './battle.js';
import { createRun, currentEnemy, rewardChoices, REST_HEAL } from './state.js';
import { makeCard } from './cards.js';
import { showScreen, renderReward, renderStats, renderDeckList } from './render.js';

function stageBattle(seed) {
  const run = createRun(seed);
  // A mid-run deck: starters plus a few drafted cards, one upgraded.
  run.deck.push(makeCard('heavy-blow'), makeCard('twin-fang', true), makeCard('iron-stance'), makeCard('venom-flask'), makeCard('might'));
  run.floor = 2;
  run.playerHp = 41;
  const battle = createBattle({
    deck: run.deck, playerHp: run.playerHp, maxHp: run.maxHp,
    enemy: currentEnemy(run), rng: run.rng,
  });
  // Play a couple of turns so the table shows damage, statuses and a
  // partially spent hand rather than a pristine opening.
  for (let t = 0; t < 2; t++) {
    for (let i = battle.hand.length - 1; i >= 0; i--) {
      playCard(battle, i, run.rng);
      if (battle.phase !== 'player') break;
    }
    if (battle.phase !== 'player') break;
    endPlayerTurn(battle, run.rng);
    if (battle.phase !== 'player') break;
  }
  showScreen('battle');
  return { run, battle };
}

function stageReward(seed) {
  const run = createRun(seed);
  run.floor = 1;
  run.playerHp = 44;
  const choices = rewardChoices(run);
  document.getElementById('reward-sub').textContent =
    'Floor 1 cleared! Add one card, upgrade one you own, or skip. You rest and heal ' + REST_HEAL + ' HP.';
  renderReward(choices);
  showScreen('reward');
  return { run, battle: null, choices };
}

function stageEnd(seed, won) {
  const run = createRun(seed);
  run.floor = won ? 3 : 2;
  run.deck.push(makeCard('executioner'), makeCard('bulwark'), makeCard('keen-eye'));
  run.stats = { battlesWon: won ? 3 : 1, cardsPlayed: 34, damageDealt: 187, turnsTaken: 14 };
  if (won) {
    renderStats('win-stats', run);
    renderDeckList('win-deck', run);
    showScreen('win');
  } else {
    document.getElementById('lose-sub').textContent =
      'Your lantern sputters and dies on floor 2, slain by the Thorn Brute.';
    renderStats('lose-stats', run);
    renderDeckList('lose-deck', run);
    showScreen('lose');
  }
  return { run, battle: null };
}

export function stageShot(name, seed) {
  if (name === 'battle') return stageBattle(seed);
  if (name === 'reward') return stageReward(seed);
  if (name === 'win') return stageEnd(seed, true);
  if (name === 'lose') return stageEnd(seed, false);
  showScreen('title');
  return { run: createRun(seed), battle: null };
}

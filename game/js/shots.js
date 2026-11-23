// Screenshot staging for Spire Mini. Opening the game with ?shot=<name>
// (and an optional &seed=) builds a fixed, seeded state so screenshots are
// reproducible: a rich mid-battle table, the reward draft, and the two end
// screens. The win screen is staged from a REAL simulated run (a simple
// greedy bot playing the actual engine on the current build, stats counted
// exactly like main.js counts them), so its numbers are genuine for this
// build. Normal play never passes through here.

import { createBattle, playCard, endPlayerTurn, currentIntent, drainEvents, collectDeck } from './battle.js';
import { createRun, currentEnemy, rewardChoices, takeReward, upgradeableCards, upgradeCard, advanceRun, FLOORS, REST_HEAL } from './state.js';
import { makeCard, resolveCard } from './cards.js';
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

// --- Greedy bot: plays a full run through the real engine -----------------
// Same simple policy as the balance simulation: block big telegraphed hits,
// powers and draw early, best damage-per-energy attacks, leftover block.
function botIncoming(b) {
  const m = currentIntent(b);
  return m.kind === 'attack' ? m.amount + b.enemy.strength : 0;
}
function botDrainStats(b, run) {
  for (const ev of drainEvents(b)) {
    if (ev.type === 'damage' && ev.target === 'enemy') run.stats.damageDealt += ev.hpLost;
  }
}
function botPlayTurn(b, run) {
  let guard = 0;
  while (b.phase === 'player' && guard++ < 40) {
    const hand = b.hand.map((c, i) => ({ c, i, r: resolveCard(c) }));
    const afford = hand.filter((h) => h.r.cost <= b.player.energy);
    if (!afford.length) break;
    const inc = botIncoming(b);
    let pick = null;
    if (inc >= 8 && b.player.block < inc) {
      const blocks = afford.filter((h) => h.r.effects.block);
      if (blocks.length) pick = blocks.sort((a, z) => z.r.effects.block - a.r.effects.block)[0];
    }
    if (!pick) pick = afford.find((h) => h.r.type === 'power');
    if (!pick) pick = afford.find((h) => h.r.effects.draw && !h.r.effects.damage);
    if (!pick) {
      const atks = afford.filter((h) => h.r.effects.damage);
      if (atks.length) {
        pick = atks.sort((a, z) =>
          (z.r.effects.damage * (z.r.effects.hits || 1) / Math.max(1, z.r.cost)) -
          (a.r.effects.damage * (a.r.effects.hits || 1) / Math.max(1, a.r.cost)))[0];
      }
    }
    if (!pick) pick = afford.find((h) => h.r.effects.block || h.r.effects.heal || h.r.effects.energy);
    if (!pick) break;
    if (!playCard(b, pick.i, run.rng)) break;
    run.stats.cardsPlayed += 1;
    botDrainStats(b, run);
  }
}
function botCardScore(r) {
  const fx = r.effects;
  let s = 0;
  if (fx.damage) s += fx.damage * (fx.hits || 1) / Math.max(1, r.cost);
  if (fx.block) s += fx.block / Math.max(1, r.cost) * 0.8;
  if (fx.draw) s += 2.5;
  if (r.type === 'power') s += 3;
  return s;
}
function botChooseReward(run) {
  const choices = rewardChoices(run);
  let best = null, bestScore = 3; // upgrading a Jab (+3 dmg) is the bar
  for (const ch of choices) {
    const s = botCardScore(resolveCard({ id: ch.id, upgraded: ch.upgraded }));
    if (s > bestScore) { bestScore = s; best = ch; }
  }
  if (best) { takeReward(run, best); return; }
  const ups = upgradeableCards(run);
  if (ups.length) {
    const jab = ups.find((c) => c.id === 'jab') || ups[0];
    upgradeCard(run, jab.uid);
  }
}
// Plays one full run; returns the finished run on a win, null on a loss.
// Stats are counted exactly like main.js counts them in real play.
function simulateRun(seed) {
  const run = createRun(seed);
  for (let f = 0; f < FLOORS; f++) {
    const b = createBattle({
      deck: run.deck, playerHp: run.playerHp, maxHp: run.maxHp,
      enemy: currentEnemy(run), rng: run.rng,
    });
    drainEvents(b);
    let turns = 0;
    while (b.phase === 'player' && turns++ < 60) {
      botPlayTurn(b, run);
      if (b.phase === 'player') {
        run.stats.turnsTaken += 1;
        endPlayerTurn(b, run.rng);
        botDrainStats(b, run);
      }
    }
    run.playerHp = b.player.hp;
    run.deck = collectDeck(b);
    if (b.phase === 'lost') return null;
    if (run.floor >= FLOORS) { run.stats.battlesWon += 1; return run; }
    botChooseReward(run);
    advanceRun(run);
  }
  return run;
}

function stageEnd(seed, won) {
  if (won) {
    // A real run on this build: first seed at/after the given one whose
    // greedy-bot run actually wins, rendered with its genuine stats.
    let run = null;
    for (let s = seed; s < seed + 50 && !run; s++) run = simulateRun(s);
    if (!run) run = createRun(seed); // unreachable in practice; never blank
    renderStats('win-stats', run);
    renderDeckList('win-deck', run);
    showScreen('win');
    return { run, battle: null };
  }
  const run = createRun(seed);
  run.floor = 2;
  run.deck.push(makeCard('executioner'), makeCard('bulwark'), makeCard('keen-eye'));
  run.stats = { battlesWon: 1, cardsPlayed: 34, damageDealt: 187, turnsTaken: 14 };
  document.getElementById('lose-sub').textContent =
    'Your lantern sputters and dies on floor 2, slain by the Thorn Brute.';
  renderStats('lose-stats', run);
  renderDeckList('lose-deck', run);
  showScreen('lose');
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

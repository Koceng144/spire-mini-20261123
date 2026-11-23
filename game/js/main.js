// Spire Mini — game flow. Wires the pure battle engine (battle.js) and run
// state (state.js) to the renderer and input: title → battle → reward →
// next floor → win/lose, with a restart back to a fresh run. Battle events
// become floating numbers, shakes and sound effects here.

import { createBattle, playCard, beginEnemyTurn, resolveEnemyTurn, drainEvents, collectDeck } from './battle.js';
import { createRun, currentEnemy, rewardChoices, takeReward, upgradeableCards, upgradeCard, advanceRun, runFinished, FLOORS, REST_HEAL } from './state.js';
import { showScreen, renderBattle, renderReward, renderUpgrade, renderStats, renderDeckList, spawnFloater, shakeEnemy } from './render.js';
import { attachInput } from './input.js';
import { sfx, setMuted, isMuted } from './audio.js';
import { stageShot } from './shots.js';

let run = null;
let battle = null;
let choices = [];
let busy = false;

const $ = (id) => document.getElementById(id);

function processEvents() {
  for (const ev of drainEvents(battle)) {
    if (ev.type === 'damage') {
      if (ev.target === 'enemy') {
        run.stats.damageDealt += ev.hpLost;
        spawnFloater(ev.hpLost > 0 ? '-' + ev.hpLost : 'Blocked', ev.hpLost > 0 ? '' : 'blocked');
        shakeEnemy();
        sfx.hit();
      } else {
        spawnFloater(ev.hpLost > 0 ? '-' + ev.hpLost : 'Blocked!', ev.hpLost > 0 ? '' : 'blocked', 'player');
        sfx.hurt();
      }
    } else if (ev.type === 'block') {
      spawnFloater('🛡 +' + ev.amount, 'blocked', ev.target === 'player' ? 'player' : 'enemy');
      if (ev.target === 'player') sfx.block();
    } else if (ev.type === 'heal') {
      spawnFloater('+' + ev.amount + ' HP', 'heal', 'player');
      sfx.heal();
    } else if (ev.type === 'play') {
      sfx.play();
    } else if (ev.type === 'draw') {
      sfx.draw();
    } else if (ev.type === 'buff') {
      sfx.buff();
    }
  }
}

function refresh(dealt) {
  renderBattle(battle, run, { dealt: !!dealt });
}

function startBattle() {
  battle = createBattle({
    deck: run.deck,
    playerHp: run.playerHp,
    maxHp: run.maxHp,
    enemy: currentEnemy(run),
    rng: run.rng,
  });
  drainEvents(battle);
  showScreen('battle');
  refresh(true);
}

function battleOver() {
  run.playerHp = battle.player.hp;
  run.deck = collectDeck(battle);
  if (battle.phase === 'lost') {
    sfx.lose();
    $('lose-sub').textContent = 'Your lantern sputters and dies on floor ' + run.floor + ', slain by the ' + battle.enemy.def.name + '.';
    renderStats('lose-stats', run);
    renderDeckList('lose-deck', run);
    showScreen('lose');
    return;
  }
  // Won this battle.
  if (run.floor >= FLOORS) {
    run.stats.battlesWon += 1;
    sfx.win();
    renderStats('win-stats', run);
    renderDeckList('win-deck', run);
    showScreen('win');
    return;
  }
  sfx.reward();
  choices = rewardChoices(run);
  $('reward-sub').textContent = 'Floor ' + run.floor + ' cleared! Add one card, upgrade one you own, or skip. You rest and heal ' + REST_HEAL + ' HP.';
  renderReward(choices);
  showScreen('reward');
}

function afterReward() {
  advanceRun(run);
  if (runFinished(run)) {
    renderStats('win-stats', run);
    showScreen('win');
    return;
  }
  startBattle();
}

function onPlayCard(index) {
  if (!battle || busy) return;
  if (playCard(battle, index, run.rng)) {
    run.stats.cardsPlayed += 1;
    processEvents();
    refresh(false);
    if (battle.phase === 'won' || battle.phase === 'lost') {
      busy = true;
      setTimeout(() => { busy = false; battleOver(); }, 700);
    }
  }
}

function onEndTurn() {
  if (!battle || busy || battle.phase !== 'player') return;
  busy = true;
  run.stats.turnsTaken += 1;
  // Phase 1: hand discards, Burn ticks, and the enemy zone lights up with
  // its telegraphed move so the player sees what is about to happen.
  beginEnemyTurn(battle);
  processEvents();
  refresh(false);
  setTimeout(() => {
    // Phase 2: the enemy performs the move, then the next turn is dealt.
    if (battle.phase === 'enemy') {
      resolveEnemyTurn(battle, run.rng);
      processEvents();
      refresh(true);
    }
    setTimeout(() => {
      busy = false;
      if (battle.phase === 'won' || battle.phase === 'lost') battleOver();
    }, 450);
  }, 750);
}

function newRun(seed) {
  run = createRun(seed);
  startBattle();
}

function toggleMute() {
  setMuted(!isMuted());
  $('btn-mute').textContent = isMuted() ? '🔇 Sound: off' : '🔊 Sound: on';
}

function wireButtons() {
  $('btn-start').addEventListener('click', () => { sfx.click(); newRun((Math.random() * 1e9) | 0); });
  $('btn-mute').addEventListener('click', toggleMute);
  $('btn-end-turn').addEventListener('click', onEndTurn);
  $('btn-skip').addEventListener('click', () => { sfx.click(); afterReward(); });
  $('btn-upgrade').addEventListener('click', () => {
    sfx.click();
    renderUpgrade(upgradeableCards(run));
    showScreen('upgrade');
  });
  $('btn-upgrade-back').addEventListener('click', () => { sfx.click(); showScreen('reward'); });
  $('btn-win-restart').addEventListener('click', () => { sfx.click(); showScreen('title'); });
  $('btn-lose-restart').addEventListener('click', () => { sfx.click(); showScreen('title'); });

  $('reward-cards').addEventListener('click', (ev) => {
    const el = ev.target.closest('.card');
    if (!el) return;
    takeReward(run, choices[Number(el.dataset.choice)]);
    sfx.reward();
    afterReward();
  });
  $('upgrade-cards').addEventListener('click', (ev) => {
    const el = ev.target.closest('.card');
    if (!el) return;
    if (upgradeCard(run, Number(el.dataset.uid))) sfx.reward();
    afterReward();
  });
}

function boot() {
  wireButtons();
  $('btn-mute').textContent = isMuted() ? '🔇 Sound: off' : '🔊 Sound: on';
  attachInput({ onPlayCard, onEndTurn, onToggleMute: toggleMute });
  // Refit the hand when the viewport changes (rotation, window resize).
  window.addEventListener('resize', () => { if (battle) refresh(false); });
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    const staged = stageShot(shot, Number(params.get('seed') || 7));
    run = staged.run;
    battle = staged.battle;
    choices = staged.choices || [];
    if (battle) { drainEvents(battle); refresh(true); }
    return;
  }
  showScreen('title');
}

boot();

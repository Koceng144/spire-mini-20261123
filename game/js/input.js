// Input for Spire Mini: click to play, drag a card onto the enemy to play,
// or use the keyboard (1–9 plays a card, Enter ends the turn, M mutes).
// Handlers are attached once and delegate through callbacks that main.js
// provides, so re-rendering the hand never loses the wiring.

import { markDropTarget } from './render.js';

const DRAG_THRESHOLD = 8;

export function attachInput({ onPlayCard, onEndTurn, onToggleMute }) {
  const hand = document.getElementById('hand');
  const enemyZone = document.getElementById('enemy-zone');
  let drag = null;

  function cardFromEvent(ev) {
    const el = ev.target.closest('.card');
    if (!el || !hand.contains(el)) return null;
    return el;
  }

  hand.addEventListener('pointerdown', (ev) => {
    const el = cardFromEvent(ev);
    if (!el || el.classList.contains('unplayable')) return;
    drag = {
      el,
      index: Number(el.dataset.index),
      startX: ev.clientX,
      startY: ev.clientY,
      moved: false,
    };
    el.setPointerCapture(ev.pointerId);
  });

  hand.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const dx = ev.clientX - drag.startX;
    const dy = ev.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    drag.el.classList.add('dragging');
    drag.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.08)';
    const r = enemyZone.getBoundingClientRect();
    markDropTarget(ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom);
  });

  function finishDrag(ev) {
    if (!drag) return;
    const { el, index, moved } = drag;
    drag = null;
    el.classList.remove('dragging');
    el.style.transform = '';
    markDropTarget(false);
    if (!moved) {
      onPlayCard(index);
      return;
    }
    const r = enemyZone.getBoundingClientRect();
    const overEnemy = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    const handTop = hand.getBoundingClientRect().top;
    if (overEnemy || ev.clientY < handTop - 40) onPlayCard(index);
  }

  hand.addEventListener('pointerup', finishDrag);
  hand.addEventListener('pointercancel', () => {
    if (drag) {
      drag.el.classList.remove('dragging');
      drag.el.style.transform = '';
      drag = null;
    }
    markDropTarget(false);
  });

  hand.addEventListener('keydown', (ev) => {
    const el = cardFromEvent(ev);
    if (el && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      if (!el.classList.contains('unplayable')) onPlayCard(Number(el.dataset.index));
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key >= '1' && ev.key <= '9') {
      onPlayCard(Number(ev.key) - 1);
    } else if (ev.key === 'Enter') {
      onEndTurn();
    } else if (ev.key === 'm' || ev.key === 'M') {
      onToggleMute();
    }
  });
}

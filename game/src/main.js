// Sky Vault: Penthouse Heist — bootstrap: input, the game loop and the
// ?scene= staging hook for screenshots. One clear job: wiring the pieces.

import {
  newGame, loadFloor, moveThief, updateGuards, updateAlarm,
  updateCaught, interact, useTool,
} from './engine.js';
import {
  drawFloor, drawLoot, drawThief, drawElevatorAndExit,
  drawHud, drawTitle, drawCaught, drawBusted, drawGetaway,
  drawGuard, drawCamera,
} from './render.js';
import { stageScene } from './scenes.js';
import { playPickup, playAlarmTick, playCaught, playWin, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const staged = params.get('scene');

const state = newGame();
loadFloor(state, 0);
let frozen = false;
if (staged) {
  frozen = stageScene(state, staged);
}

// --- input ------------------------------------------------------------------

const keys = new Set();
let mouseTarget = null;
let lastAlarmTick = 0;

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  unlockAudio();
  const k = e.key.toLowerCase();
  keys.add(k);
  if (k === 'enter' && state.phase === 'title') {
    state.phase = 'play';
    state.message = 'Grab the keycard in the bedroom wing, then crack the safe.';
    state.messageUntil = state.time + 4;
  }
  if ((k === 'e' || k === ' ') && !e.repeat) {
    const before = state.lootTaken.size + (state.hasKeycard ? 1 : 0);
    interact(state);
    const after = state.lootTaken.size + (state.hasKeycard ? 1 : 0);
    if (after > before) playPickup();
  }
  if (k === 'q' && !e.repeat) useTool(state, 'emp');
  if (k === 'f' && !e.repeat) useTool(state, 'smoke');
  if (k === 'r' && (state.phase === 'busted' || state.phase === 'getaway')) {
    const fresh = newGame();
    Object.assign(state, fresh);
    loadFloor(state, 0);
    state.phase = 'play';
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener('mousedown', (e) => {
  unlockAudio();
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  mouseTarget = { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  if (state.phase === 'title') {
    state.phase = 'play';
    state.message = 'Grab the keycard in the bedroom wing, then crack the safe.';
    state.messageUntil = state.time + 4;
  }
});

function readMove() {
  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (dx === 0 && dy === 0 && mouseTarget) {
    const mx = mouseTarget.x - state.thief.x;
    const my = mouseTarget.y - state.thief.y;
    const d = Math.hypot(mx, my);
    if (d < 10) {
      mouseTarget = null;
    } else {
      dx = mx / d;
      dy = my / d;
    }
  }
  return { dx, dy };
}

// --- loop -------------------------------------------------------------------

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.time += dt;

  if (!frozen) {
    if (state.phase === 'play') {
      const { dx, dy } = readMove();
      moveThief(state, dx, dy, dt);
      updateGuards(state, dt);
      const prevAlarm = state.alarm;
      updateAlarm(state, dt);
      if (state.alarm > 55 && Math.floor(state.alarm / 10) !== Math.floor(prevAlarm / 10)) {
        playAlarmTick();
      }
      if (state.phase === 'caught') playCaught();
    } else if (state.phase === 'caught') {
      updateCaught(state, dt);
      updateGuards(state, dt);
      if (state.phase === 'busted') playCaught();
    } else if (state.phase === 'getaway' && !state._winPlayed) {
      state._winPlayed = true;
      playWin();
    }
  }

  // --- draw -----------------------------------------------------------------
  drawFloor(ctx, state, state.time);
  drawLoot(ctx, state, state.time);
  drawElevatorAndExit(ctx, state);
  for (const g of state.guards) drawGuard(ctx, g, state.time);
  for (const c of state.cameras) drawCamera(ctx, c, state);
  drawThief(ctx, state, state.time);
  drawHud(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'caught') drawCaught(ctx, state);
  if (state.phase === 'busted') drawBusted(ctx, state);
  if (state.phase === 'getaway') drawGetaway(ctx, state);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

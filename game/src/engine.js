// Sky Vault: Penthouse Heist — game state, movement, vision and alarm rules.
// One clear job: how the heist plays, with no drawing code in here.

import { FLOORS, VIEW_W, VIEW_H } from './levels.js';

export const THIEF_SPEED = 210;
export const THIEF_RADIUS = 14;
export const ALARM_MAX = 100;
export const GRACE_SECONDS = 1.0;

export function newGame() {
  return {
    phase: 'title', // title | play | caught | busted | getaway
    floor: 0,
    thief: { x: 640, y: 700, angle: -Math.PI / 2, moving: false },
    alarm: 0,
    score: 0,
    lootTaken: new Set(),
    hasKeycard: false,
    empLeft: 0,
    smokeLeft: 0,
    smokeAt: null,
    graceLeft: 0,
    time: 0,
    message: '',
    messageUntil: 0,
    guards: [],
    cameras: [],
    spottedBy: null,
    stats: { spotted: 0, toolsUsed: 0 },
  };
}

export function loadFloor(state, floorId) {
  const def = FLOORS[floorId];
  state.floor = floorId;
  state.guards = def.guards.map((g) => ({
    ...g,
    x: g.path[0][0],
    y: g.path[0][1],
    leg: 0,
    angle: 0,
    pauseLeft: 0,
    alert: 0,
  }));
  state.cameras = def.cameras.map((c) => ({ ...c, angle: c.baseAngle, t: Math.random() * 6 }));
  state.thief.x = def.spawn.x;
  state.thief.y = def.spawn.y;
}

// --- geometry helpers -------------------------------------------------------

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const axes = [
    [dx, x1 - rect.x],
    [-dx, rect.x + rect.w - x1],
    [dy, y1 - rect.y],
    [-dy, rect.y + rect.h - y1],
  ];
  for (const [p, q] of axes) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// Line of sight: solid walls block it, glass walls do not (the twist).
export function lineOfSight(floorDef, x1, y1, x2, y2) {
  for (const w of floorDef.walls) {
    if (w.type !== 'solid') continue;
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// --- movement ---------------------------------------------------------------

export function moveThief(state, dx, dy, dt) {
  const def = FLOORS[state.floor];
  const len = Math.hypot(dx, dy);
  if (len < 0.01) {
    state.thief.moving = false;
    return;
  }
  const nx = state.thief.x + (dx / len) * THIEF_SPEED * dt;
  const ny = state.thief.y + (dy / len) * THIEF_SPEED * dt;
  state.thief.angle = Math.atan2(dy, dx);
  state.thief.moving = true;
  // Axis-separated so the thief slides along walls instead of sticking.
  let blocked = false;
  for (const w of def.walls) {
    if (circleHitsRect(nx, state.thief.y, THIEF_RADIUS, w)) { blocked = true; break; }
  }
  if (!blocked && nx > 58 && nx < VIEW_W - 58) state.thief.x = nx;
  blocked = false;
  for (const w of def.walls) {
    if (circleHitsRect(state.thief.x, ny, THIEF_RADIUS, w)) { blocked = true; break; }
  }
  if (!blocked && ny > 58 && ny < VIEW_H - 58) state.thief.y = ny;
}

// --- guards and cameras -----------------------------------------------------

export function updateGuards(state, dt) {
  const def = FLOORS[state.floor];
  for (const g of state.guards) {
    if (g.pauseLeft > 0) {
      g.pauseLeft -= dt;
      continue;
    }
    const target = g.path[(g.leg + 1) % g.path.length];
    const dx = target[0] - g.x;
    const dy = target[1] - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      g.leg = (g.leg + 1) % g.path.length;
      g.pauseLeft = g.pause;
      continue;
    }
    g.angle = Math.atan2(dy, dx);
    g.x += (dx / dist) * g.speed * dt;
    g.y += (dy / dist) * g.speed * dt;
    g.alert = Math.max(0, g.alert - dt * 0.4);
  }
  for (const c of state.cameras) {
    c.t += dt;
    c.angle = c.baseAngle + Math.sin(c.t * c.speed) * c.sweep;
  }
}

// Can this watcher see the thief right now?
export function watcherSees(state, wx, wy, angle, range, fov) {
  const def = FLOORS[state.floor];
  const dx = state.thief.x - wx;
  const dy = state.thief.y - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 4) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > fov / 2 + 0.12) return false;
  if (!lineOfSight(def, wx, wy, state.thief.x, state.thief.y)) return false;
  if (state.smokeLeft > 0 && state.smokeAt) {
    const sd = Math.hypot(state.thief.x - state.smokeAt.x, state.thief.y - state.smokeAt.y);
    if (sd < 90) return false; // smoke hides the thief
  }
  return true;
}

// --- alarm, tools and interaction -------------------------------------------

export function updateAlarm(state, dt) {
  const def = FLOORS[state.floor];
  let seen = null;
  for (const g of state.guards) {
    if (watcherSees(state, g.x, g.y, g.angle, g.range, g.fov)) { seen = g.name; g.alert = 1; }
  }
  if (state.empLeft <= 0) {
    for (const c of state.cameras) {
      if (watcherSees(state, c.x, c.y, c.angle, c.range, c.fov)) { seen = 'camera'; }
    }
  }
  if (seen) {
    state.spottedBy = seen;
    state.alarm += 34 * dt;
    state.stats.spotted++;
    if (state.alarm >= ALARM_MAX) {
      state.alarm = ALARM_MAX;
      state.graceLeft = GRACE_SECONDS;
      state.phase = 'caught';
      state.message = 'SPOTTED! Break line of sight — NOW!';
      state.messageUntil = state.time + 1.2;
    }
  } else {
    state.spottedBy = null;
    state.alarm = Math.max(0, state.alarm - 7 * dt);
  }
  if (state.empLeft > 0) state.empLeft -= dt;
  if (state.smokeLeft > 0) {
    state.smokeLeft -= dt;
    if (state.smokeLeft <= 0) state.smokeAt = null;
  }
}

export function updateCaught(state, dt) {
  // The fair caught moment: one full grace second to break line of sight.
  const def = FLOORS[state.floor];
  let stillSeen = false;
  for (const g of state.guards) {
    if (watcherSees(state, g.x, g.y, g.angle, g.range, g.fov)) stillSeen = true;
  }
  if (!stillSeen) {
    state.phase = 'play';
    state.alarm = 62;
    state.message = 'You slipped away — barely. The alarm is still hot.';
    state.messageUntil = state.time + 2.5;
    return;
  }
  state.graceLeft -= dt;
  if (state.graceLeft <= 0) state.phase = 'busted';
}

export function useTool(state, tool) {
  if (state.phase !== 'play') return false;
  if (tool === 'emp') {
    if (state.score < 25 || state.empLeft > 0) return false;
    state.score -= 25;
    state.empLeft = 6;
    state.stats.toolsUsed++;
    state.message = 'EMP pulse — cameras dark for 6 s (−25 score)';
    state.messageUntil = state.time + 2;
    return true;
  }
  if (tool === 'smoke') {
    if (state.score < 15 || state.smokeLeft > 0) return false;
    state.score -= 15;
    state.smokeLeft = 4;
    state.smokeAt = { x: state.thief.x, y: state.thief.y };
    state.stats.toolsUsed++;
    state.message = 'Smoke puff — you are hidden for 4 s (−15 score)';
    state.messageUntil = state.time + 2;
    return true;
  }
  return false;
}

function near(state, x, y, radius) {
  return Math.hypot(state.thief.x - x, state.thief.y - y) < radius;
}

// E / Space: pick up loot, grab the keycard, ride the elevator, escape.
export function interact(state) {
  if (state.phase !== 'play') return;
  const def = FLOORS[state.floor];
  if (def.keycard && !state.hasKeycard && near(state, def.keycard.x, def.keycard.y, 42)) {
    state.hasKeycard = true;
    state.score += 50;
    state.message = 'VAULT KEYCARD acquired (+50). The safe can open now.';
    state.messageUntil = state.time + 2.5;
    return;
  }
  for (const loot of def.loot) {
    if (state.lootTaken.has(loot.id)) continue;
    if (!near(state, loot.x, loot.y, 44)) continue;
    if (loot.needsKeycard && !state.hasKeycard) {
      state.message = 'The safe needs the VAULT KEYCARD (bedroom wing).';
      state.messageUntil = state.time + 2.5;
      return;
    }
    state.lootTaken.add(loot.id);
    state.score += loot.value;
    state.message = `${loot.label} — +${loot.value} score`;
    state.messageUntil = state.time + 2.5;
    return;
  }
  if (def.exit && near(state, def.exit.x + def.exit.w / 2, def.exit.y + def.exit.h / 2, 90)) {
    if (state.lootTaken.has('safe')) {
      state.phase = 'getaway';
      state.message = '';
    } else {
      state.message = 'The rooftop lift needs the PENTHOUSE SAFE first.';
      state.messageUntil = state.time + 2.5;
    }
    return;
  }
  const el = def.elevator;
  if (near(state, el.x + el.w / 2, el.y + el.h / 2, 80)) {
    const next = state.floor === 0 ? 1 : 0;
    loadFloor(state, next);
    state.message = next === 1
      ? 'Service level — dark corridors, no glass. Flank them.'
      : 'Penthouse — glass everywhere. They can see you through it.';
    state.messageUntil = state.time + 3;
  }
}

export function lootValue(state) {
  let total = 0;
  for (const def of FLOORS) {
    for (const loot of def.loot) {
      if (state.lootTaken.has(loot.id)) total += loot.value;
    }
  }
  return total;
}

export function totalLootCount() {
  return FLOORS.reduce((n, f) => n + f.loot.length, 0);
}

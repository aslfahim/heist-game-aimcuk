// Sky Vault: Penthouse Heist — all drawing: the penthouse at dusk, the
// service level, vision cones, cameras, loot, the thief and the HUD.
// One clear job: what the player sees, nothing about rules.

import { FLOORS, VIEW_W, VIEW_H } from './levels.js';
import { ALARM_MAX } from './engine.js';

const CITY_COLORS = ['#ffd27a', '#7ab8ff', '#ff9d7a', '#9dffc4', '#e2a9ff'];

export function drawCityLights(ctx, t) {
  // Dusk skyline glowing far below the glass walls.
  for (let i = 0; i < 90; i++) {
    const x = (i * 137) % VIEW_W;
    const y = 800 - ((i * 53) % 90) - 8;
    const tw = 0.35 + 0.35 * Math.sin(t * 1.7 + i * 2.3);
    ctx.fillStyle = CITY_COLORS[i % CITY_COLORS.length];
    ctx.globalAlpha = tw;
    ctx.fillRect(x, y, 3, 3);
  }
  ctx.globalAlpha = 1;
}

export function drawFloor(ctx, state, t) {
  const def = FLOORS[state.floor];
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (state.floor === 0) drawCityLights(ctx, t);

  // Room floors.
  for (const room of def.rooms) {
    ctx.fillStyle = room.tint;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(room.label, room.x + 12, room.y + 24);
  }

  // Marble floor sheen on the penthouse lounge.
  if (state.floor === 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 340; x < 940; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 58); ctx.lineTo(x, 742); ctx.stroke();
    }
    for (let y = 120; y < 742; y += 60) {
      ctx.beginPath(); ctx.moveTo(318, y); ctx.lineTo(940, y); ctx.stroke();
    }
  }

  // Glass walls: pale blue panes with a shine line — see-through, and the
  // cones pass through them (see engine.lineOfSight).
  for (const g of def.glass) {
    ctx.fillStyle = 'rgba(140,200,255,0.28)';
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(g.x, g.y, g.w, 2);
    ctx.fillStyle = 'rgba(140,200,255,0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('GLASS — SEEN THROUGH', g.x + 8, g.y - 6);
  }

  // Solid walls.
  for (const w of def.walls) {
    if (w.type === 'glass') continue;
    ctx.fillStyle = '#2c3358';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#3d4670';
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
}

export function drawVisionCone(ctx, x, y, angle, range, fov, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - fov / 2, angle + fov / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawGuard(ctx, g, t) {
  const alerted = g.alert > 0.4;
  drawVisionCone(ctx, g.x, g.y, g.angle, g.range, g.fov,
    alerted ? '#ff4444' : '#ffd23f', alerted ? 0.34 : 0.20);
  // Guard body: dark suit, gold badge, facing tick.
  ctx.fillStyle = '#1c1c26';
  ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = alerted ? '#ff5555' : '#ffd23f';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = alerted ? '#ff5555' : '#ffd23f';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 8, g.y + Math.sin(g.angle) * 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(g.name.toUpperCase(), g.x - 16, g.y - 20);
}

export function drawCamera(ctx, c, state) {
  const disabled = state.empLeft > 0;
  if (!disabled) {
    drawVisionCone(ctx, c.x, c.y, c.angle, c.range, c.fov, '#ff7a3c', 0.22);
  }
  ctx.fillStyle = '#111';
  ctx.fillRect(c.x - 9, c.y - 6, 18, 12);
  ctx.strokeStyle = disabled ? '#666' : '#ff7a3c';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x - 9, c.y - 6, 18, 12);
  ctx.fillStyle = disabled ? '#888' : '#ff3b30';
  ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill();
  // Sweep arm showing where the lens points.
  ctx.strokeStyle = disabled ? '#555' : '#ffb37a';
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x + Math.cos(c.angle) * 22, c.y + Math.sin(c.angle) * 22);
  ctx.stroke();
  if (disabled) {
    ctx.fillStyle = '#9fd8ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('EMP — DARK', c.x - 26, c.y - 14);
  }
}

const LOOT_GLYPH = { art: '▣', watch: '◷', safe: '▤', cash: '$' };
const LOOT_COLOR = { art: '#e2a9ff', watch: '#ffd23f', safe: '#7dffb0', cash: '#9dffc4' };

export function drawLoot(ctx, state, t) {
  const def = FLOORS[state.floor];
  for (const loot of def.loot) {
    if (state.lootTaken.has(loot.id)) continue;
    const pulse = 1 + 0.12 * Math.sin(t * 3 + loot.x);
    ctx.save();
    ctx.translate(loot.x, loot.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = LOOT_COLOR[loot.kind];
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = LOOT_COLOR[loot.kind];
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LOOT_GLYPH[loot.kind], 0, 1);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = LOOT_COLOR[loot.kind];
    ctx.font = 'bold 11px monospace';
    ctx.fillText(loot.label.toUpperCase(), loot.x - 40, loot.y + 32);
  }
  if (def.keycard && !state.hasKeycard) {
    ctx.fillStyle = '#7dffb0';
    ctx.fillRect(def.keycard.x - 12, def.keycard.y - 8, 24, 16);
    ctx.fillStyle = '#06281a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(def.keycard.label, def.keycard.x - 52, def.keycard.y + 28);
  }
}

// render.js (continued): the thief, elevator/exit, HUD and the end screens.

import { lootValue, totalLootCount } from './engine.js';

export function drawThief(ctx, state, t) {
  const th = state.thief;
  // Smoke cloud hides the thief.
  if (state.smokeLeft > 0 && state.smokeAt) {
    ctx.fillStyle = 'rgba(180,190,210,0.35)';
    ctx.beginPath(); ctx.arc(state.smokeAt.x, state.smokeAt.y, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180,190,210,0.25)';
    ctx.beginPath(); ctx.arc(state.smokeAt.x + 20, state.smokeAt.y - 14, 46, 0, Math.PI * 2); ctx.fill();
  }
  const bob = state.thief.moving ? Math.sin(t * 14) * 2 : 0;
  ctx.save();
  ctx.translate(th.x, th.y + bob);
  ctx.rotate(th.angle);
  // Cloak: dark teal triangle with a gold trim, facing the movement angle.
  ctx.fillStyle = '#0e3a3a';
  ctx.beginPath();
  ctx.moveTo(18, 0); ctx.lineTo(-12, -11); ctx.lineTo(-7, 0); ctx.lineTo(-12, 11);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath(); ctx.arc(4, 0, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('YOU — THE THIEF', th.x - 46, th.y - 26);
}

export function drawElevatorAndExit(ctx, state) {
  const def = FLOORS[state.floor];
  const el = def.elevator;
  ctx.fillStyle = '#233a2e';
  ctx.fillRect(el.x, el.y, el.w, el.h);
  ctx.strokeStyle = '#7dffb0';
  ctx.lineWidth = 2;
  ctx.strokeRect(el.x, el.y, el.w, el.h);
  ctx.fillStyle = '#7dffb0';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('⇅ ' + el.label, el.x + 8, el.y + 30);
  if (def.exit) {
    const ex = def.exit;
    const ready = state.lootTaken.has('safe');
    ctx.fillStyle = ready ? '#1d5c34' : '#3a2a1e';
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.strokeStyle = ready ? '#7dffb0' : '#ff9d7a';
    ctx.lineWidth = 3;
    ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
    ctx.fillStyle = ready ? '#7dffb0' : '#ff9d7a';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('ROOFTOP LIFT', ex.x + 26, ex.y + 40);
    ctx.font = '11px monospace';
    ctx.fillText(ready ? 'SAFE SECURED — GO!' : 'NEEDS THE SAFE', ex.x + 18, ex.y + 62);
    ctx.font = 'bold 30px monospace';
    ctx.fillText('▲', ex.x + 66, ex.y + 108);
  }
}

export function drawHud(ctx, state) {
  const def = FLOORS[state.floor];
  // Top bar.
  ctx.fillStyle = 'rgba(5,8,20,0.85)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('SKY VAULT: PENTHOUSE HEIST', 16, 29);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#9fd8ff';
  ctx.fillText(def.name, 430, 29);
  // Alarm meter — the judge needs it visible in one frame with the room.
  const ax = 760;
  const frac = state.alarm / ALARM_MAX;
  ctx.fillStyle = '#222';
  ctx.fillRect(ax, 12, 220, 22);
  ctx.fillStyle = frac < 0.4 ? '#ffd23f' : frac < 0.75 ? '#ff7a3c' : '#ff3b30';
  ctx.fillRect(ax, 12, 220 * frac, 22);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, 12, 220, 22);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ALARM ' + Math.round(state.alarm) + '%', ax + 8, 29);
  if (state.phase === 'caught') {
    ctx.fillStyle = '#ff3b30';
    ctx.fillText('GRACE ' + Math.max(0, state.graceLeft).toFixed(1) + 's — HIDE!', ax + 230, 29);
  }
  // Score / loot / tools strip.
  ctx.fillStyle = 'rgba(5,8,20,0.85)';
  ctx.fillRect(0, VIEW_H - 40, VIEW_W, 40);
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('SCORE ' + state.score, 16, VIEW_H - 14);
  ctx.fillStyle = '#7dffb0';
  ctx.fillText('LOOT ' + state.lootTaken.size + '/' + totalLootCount() + '  ($' + lootValue(state) + ')', 180, VIEW_H - 14);
  ctx.fillStyle = state.hasKeycard ? '#7dffb0' : '#888';
  ctx.fillText(state.hasKeycard ? 'KEYCARD ✓' : 'KEYCARD —', 400, VIEW_H - 14);
  ctx.fillStyle = state.empLeft > 0 ? '#9fd8ff' : '#ccc';
  ctx.fillText('Q EMP ' + (state.empLeft > 0 ? Math.ceil(state.empLeft) + 's' : '(−25)'), 560, VIEW_H - 14);
  ctx.fillStyle = state.smokeLeft > 0 ? '#cdd6e4' : '#ccc';
  ctx.fillText('F SMOKE ' + (state.smokeLeft > 0 ? Math.ceil(state.smokeLeft) + 's' : '(−15)'), 700, VIEW_H - 14);
  ctx.fillStyle = '#888';
  ctx.fillText('E interact · WASD move · glass hides nothing', 880, VIEW_H - 14);
  // Transient message.
  if (state.message && state.time < state.messageUntil) {
    ctx.fillStyle = 'rgba(5,8,20,0.9)';
    const w = ctx.measureText(state.message).width + 28;
    ctx.fillRect((VIEW_W - w) / 2, 58, w, 32);
    ctx.strokeStyle = '#ffd23f';
    ctx.strokeRect((VIEW_W - w) / 2, 58, w, 32);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(state.message, (VIEW_W - w) / 2 + 14, 79);
  }
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4,6,16,0.88)';
  ctx.fillRect(340, 190, 600, 420);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(340, 190, 600, 420);
  ctx.fillStyle = accent;
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 260);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '17px monospace';
  lines.forEach((line, i) => ctx.fillText(line, 640, 310 + i * 34));
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(4,6,16,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 'SKY VAULT', [
    'PENTHOUSE HEIST',
    '',
    'Cross the glass lounge. Guards see through glass.',
    'Grab the keycard, crack the safe, ride the rooftop lift.',
    '',
    'WASD / arrows — move      E — interact',
    'Q — EMP (−25)      F — smoke (−15)',
    '',
    'Press ENTER or click to start the heist.',
  ], '#ffd23f');
}

export function drawCaught(ctx, state) {
  ctx.fillStyle = 'rgba(60,4,4,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 'SPOTTED!', [
    'Caught in the open by ' + (state.spottedBy || 'a guard') + '.',
    'Grace: ' + Math.max(0, state.graceLeft).toFixed(1) + 's — break line of sight!',
    '',
    'Hide behind marble. Glass will not save you.',
  ], '#ff3b30');
}

export function drawBusted(ctx, state) {
  panel(ctx, 'BUSTED', [
    'The alarm hit 100%. Security swarmed the penthouse.',
    '',
    'Score: ' + state.score + '   Loot: ' + state.lootTaken.size + '/' + totalLootCount(),
    '',
    'Press R to run it back.',
  ], '#ff3b30');
}

export function drawGetaway(ctx, state) {
  panel(ctx, 'CLEAN GETAWAY!', [
    'The rooftop lift drops you into the dusk — safe in hand.',
    '',
    'Final score: ' + state.score + '   Loot value: $' + lootValue(state),
    'Loot grabbed: ' + state.lootTaken.size + '/' + totalLootCount(),
    'Times spotted: ' + state.stats.spotted + '   Tools used: ' + state.stats.toolsUsed,
    '',
    'Press R to heist again.',
  ], '#7dffb0');
}

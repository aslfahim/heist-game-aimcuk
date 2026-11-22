// Sky Vault: Penthouse Heist — staged scenes for screenshots (?scene=).
// Each scene is a real render of the game's own code: the same update and
// draw path as live play, with the state posed mid-heist. One clear job:
// posing the game for its cover and detail shots.

import { COVER_STATE } from './levels.js';
import { loadFloor } from './engine.js';

function poseGuards(state, spots, angles) {
  state.guards.forEach((g, i) => {
    if (spots[i]) {
      g.x = spots[i][0];
      g.y = spots[i][1];
    }
    if (angles[i] !== undefined) g.angle = angles[i];
    g.alert = i === 1 ? 1 : 0;
  });
}

function poseCameras(state, angles) {
  state.cameras.forEach((c, i) => {
    if (angles[i] !== undefined) c.angle = angles[i];
  });
}

export function stageScene(state, name) {
  // Returns true when a scene was staged (play phase, posed state).
  if (name === 'cover') {
    const s = COVER_STATE;
    loadFloor(state, s.floor);
    state.phase = 'play';
    state.thief.x = s.thief.x;
    state.thief.y = s.thief.y;
    state.thief.angle = -Math.PI / 2;
    poseGuards(state, s.guardSpots, s.guardAngles);
    poseCameras(state, s.cameraAngles);
    state.alarm = s.alarm;
    state.score = s.score;
    state.lootTaken = new Set(s.lootTaken);
    state.hasKeycard = true;
    state.message = 'The safe is open — grab it and run for the lift.';
    state.messageUntil = 99999;
    return true;
  }
  if (name === 'patrol') {
    loadFloor(state, 1);
    state.phase = 'play';
    state.thief.x = 500;
    state.thief.y = 420;
    state.thief.angle = Math.PI;
    poseGuards(state, [[760, 420], [980, 640]], [Math.PI, -Math.PI / 2]);
    poseCameras(state, [Math.PI / 2]);
    state.alarm = 12;
    state.score = 250;
    state.message = 'Service level — dark corridors, no glass. Flank them.';
    state.messageUntil = 99999;
    return true;
  }
  if (name === 'vault') {
    loadFloor(state, 0);
    state.phase = 'play';
    state.thief.x = 1060;
    state.thief.y = 480;
    state.thief.angle = -Math.PI / 2;
    poseGuards(state, [[1010, 330], [520, 330], [220, 560]], [-Math.PI / 2, 0, Math.PI * 0.5]);
    poseCameras(state, [Math.PI * 0.6, Math.PI]);
    state.alarm = 58;
    state.score = 750;
    state.lootTaken = new Set(['art1', 'watch', 'art2']);
    state.hasKeycard = true;
    state.message = 'Safe cracked! +800 — get to the rooftop lift.';
    state.messageUntil = 99999;
    return true;
  }
  if (name === 'getaway') {
    loadFloor(state, 0);
    state.phase = 'getaway';
    state.score = 1450;
    state.lootTaken = new Set(['art1', 'watch', 'art2', 'safe', 'cash']);
    state.stats.spotted = 2;
    state.stats.toolsUsed = 1;
    return true;
  }
  return false;
}

// Sky Vault: Penthouse Heist — level layouts for both floors.
// Floor 0 is the glass penthouse (lounge, bedroom wing, vault room).
// Floor 1 is the service level below (corridors, storage, vents).
// Walls are rectangles: type "solid" blocks sight and movement,
// type "glass" blocks movement only — guards see straight through it.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Shared outer shell (both floors share the tower footprint).
function shell() {
  return [
    { x: 40, y: 40, w: 1200, h: 18, type: 'solid' },   // north wall
    { x: 40, y: 742, w: 1200, h: 18, type: 'solid' },  // south wall
    { x: 40, y: 40, w: 18, h: 720, type: 'solid' },    // west wall
    { x: 1222, y: 40, w: 18, h: 720, type: 'solid' },  // east wall
  ];
}

export const FLOORS = [
  {
    id: 0,
    name: 'PENTHOUSE — FLOOR 88',
    subtitle: 'Glass lounge · Bedroom wing · Vault room',
    spawn: { x: 640, y: 700 },
    walls: [
      ...shell(),
      // Bedroom wing (west): solid divider with a door gap.
      { x: 300, y: 40, w: 18, h: 300, type: 'solid' },
      { x: 300, y: 420, w: 18, h: 340, type: 'solid' },
      { x: 58, y: 380, w: 242, h: 16, type: 'solid' },
      // Vault room (east): glass front, solid back — the safe is visible, exposed.
      { x: 940, y: 40, w: 18, h: 240, type: 'solid' },
      { x: 940, y: 360, w: 18, h: 200, type: 'solid' },
      { x: 958, y: 280, w: 264, h: 14, type: 'glass' },
      { x: 958, y: 560, w: 264, h: 14, type: 'glass' },
      // Lounge furniture as low marble blocks (solid cover).
      { x: 470, y: 180, w: 180, h: 26, type: 'solid' },  // marble bar
      { x: 470, y: 480, w: 26, h: 150, type: 'solid' },  // pillar
      { x: 760, y: 480, w: 26, h: 150, type: 'solid' },  // pillar
      { x: 620, y: 300, w: 120, h: 90, type: 'solid' },  // lounge table
      // Glass balcony wall along the north lounge: see the city, be seen.
      { x: 340, y: 58, w: 580, h: 10, type: 'glass' },
    ],
    glass: [
      { x: 340, y: 58, w: 580, h: 10 },
      { x: 958, y: 280, w: 264, h: 14 },
      { x: 958, y: 560, w: 264, h: 14 },
    ],
    rooms: [
      { x: 58, y: 58, w: 242, h: 322, label: 'BEDROOM WING', tint: '#1d2b52' },
      { x: 58, y: 396, w: 242, h: 346, label: 'BATH / DRESSING', tint: '#1a2447' },
      { x: 318, y: 58, w: 622, h: 684, label: 'GLASS LOUNGE', tint: '#141a38' },
      { x: 958, y: 58, w: 264, h: 502, label: 'VAULT ROOM', tint: '#241a3a' },
      { x: 958, y: 574, w: 264, h: 168, label: 'ROOFTOP LIFT', tint: '#0f2a22' },
    ],
    loot: [
      { id: 'art1', kind: 'art', x: 120, y: 120, value: 150, label: '“Dusk Skyline” painting' },
      { id: 'watch', kind: 'watch', x: 200, y: 640, value: 300, label: 'Rare watch collection' },
      { id: 'art2', kind: 'art', x: 1100, y: 120, value: 150, label: '“Violet Hour” sculpture' },
      { id: 'safe', kind: 'safe', x: 1090, y: 420, value: 800, label: 'PENTHOUSE SAFE', needsKeycard: true },
      { id: 'cash', kind: 'cash', x: 700, y: 650, value: 100, label: 'Lounge cash' },
    ],
    keycard: { x: 150, y: 300, label: 'VAULT KEYCARD' },
    guards: [
      { name: 'Marco', path: [[420, 200], [880, 200], [880, 420], [420, 420]], speed: 70, range: 230, fov: 1.15, pause: 1.2 },
      { name: 'Lena', path: [[1020, 620], [1180, 620], [1180, 330], [1020, 330]], speed: 80, range: 210, fov: 1.05, pause: 0.8 },
      { name: 'Rook', path: [[180, 500], [180, 700], [280, 700], [280, 500]], speed: 60, range: 200, fov: 1.0, pause: 1.5 },
    ],
    cameras: [
      { x: 640, y: 66, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 260, fov: 0.5 },
      { x: 1222, y: 300, baseAngle: Math.PI, sweep: 0.7, speed: 0.7, range: 240, fov: 0.5 },
      { x: 318, y: 742, baseAngle: -Math.PI / 2, sweep: 0.8, speed: 0.45, range: 250, fov: 0.5 },
    ],
    elevator: { x: 560, y: 690, w: 160, h: 52, label: 'ELEVATOR — SERVICE LEVEL' },
    exit: { x: 1010, y: 600, w: 160, h: 130, label: 'ROOFTOP LIFT — GETAWAY' },
  },
  {
    id: 1,
    name: 'SERVICE LEVEL — FLOOR 87',
    subtitle: 'Corridors · Storage · Vents — flank the guards upstairs',
    spawn: { x: 640, y: 700 },
    walls: [
      ...shell(),
      // Corridor spine: solid walls with three gaps (routes).
      { x: 58, y: 300, w: 420, h: 18, type: 'solid' },
      { x: 560, y: 300, w: 300, h: 18, type: 'solid' },
      { x: 940, y: 300, w: 282, h: 18, type: 'solid' },
      { x: 58, y: 520, w: 300, h: 18, type: 'solid' },
      { x: 440, y: 520, w: 420, h: 18, type: 'solid' },
      { x: 940, y: 520, w: 282, h: 18, type: 'solid' },
      // Storage crates (solid cover).
      { x: 120, y: 120, w: 90, h: 90, type: 'solid' },
      { x: 1000, y: 120, w: 90, h: 90, type: 'solid' },
      { x: 120, y: 600, w: 90, h: 90, type: 'solid' },
      { x: 1000, y: 600, w: 90, h: 90, type: 'solid' },
    ],
    glass: [],
    rooms: [
      { x: 58, y: 58, w: 1164, h: 242, label: 'STORAGE NORTH', tint: '#1c1a2e' },
      { x: 58, y: 318, w: 1164, h: 202, label: 'SERVICE CORRIDOR', tint: '#171628' },
      { x: 58, y: 538, w: 1164, h: 204, label: 'STORAGE SOUTH · VENT SHAFT', tint: '#1c1a2e' },
    ],
    loot: [
      { id: 'gems', kind: 'cash', x: 1050, y: 160, value: 200, label: 'Smuggled gems' },
      { id: 'art3', kind: 'art', x: 180, y: 160, value: 150, label: 'Crated artwork' },
      { id: 'cash2', kind: 'cash', x: 640, y: 420, value: 100, label: 'Guard payroll cash' },
    ],
    keycard: null,
    guards: [
      { name: 'Vera', path: [[200, 420], [1080, 420], [1080, 420]], speed: 75, range: 220, fov: 1.1, pause: 1.0 },
      { name: 'Omar', path: [[640, 640], [1100, 640], [1100, 640]], speed: 65, range: 200, fov: 1.0, pause: 1.4 },
    ],
    cameras: [
      { x: 640, y: 66, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.6, range: 250, fov: 0.5 },
      { x: 58, y: 420, baseAngle: 0, sweep: 0.7, speed: 0.5, range: 230, fov: 0.5 },
    ],
    elevator: { x: 560, y: 690, w: 160, h: 52, label: 'ELEVATOR — PENTHOUSE' },
    exit: null,
  },
];

// The staged cover state: a mid-heist moment on the penthouse floor where the
// thief crosses the glass lounge while two guards and two cameras sweep toward
// the vault, with loot and the alarm meter all on screen at once.
export const COVER_STATE = {
  floor: 0,
  thief: { x: 700, y: 470 },
  guardAngles: [Math.PI * 0.72, -Math.PI * 0.35, Math.PI * 0.5],
  guardSpots: [[520, 330], [1010, 470], [220, 560]],
  cameraAngles: [Math.PI * 0.55, Math.PI * 0.9],
  alarm: 34,
  score: 450,
  lootTaken: ['art1'],
};

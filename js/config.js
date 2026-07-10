import { CENTER_X, CENTER_Y } from './dom.js';
import { state } from './state.js';

// --- Concentric Target Radii ---
export const RADIUS_CLOSE = 190;
export const RADIUS_MID = 270;
export const RADIUS_FAR = 345;

// --- Central Choice Coordinates ---
export const CHOICE_CAR_POS = { x: CENTER_X - 80, y: CENTER_Y + 20 };
export const CHOICE_TRUCK_POS = { x: CENTER_X + 80, y: CENTER_Y + 20 };
export const CHOICE_RADIUS = 65;

// --- Campaign Level Matrix Configuration ---
export const LEVEL_MATRIX = [
  // STAGE 1 (Desert scenery, 0 distractors, 8 radial axes)
  { level: 1, stage: 1, name: "Desert Novice 1", background: "DESERT", vehicleA: "convertible", vehicleB: "panel_van", distance: "CLOSE", distractors: 0, axes: 8 },
  { level: 2, stage: 1, name: "Desert Novice 2", background: "DESERT", vehicleA: "convertible", vehicleB: "panel_van", distance: "MID",   distractors: 0, axes: 8 },
  { level: 3, stage: 1, name: "Desert Novice 3", background: "DESERT", vehicleA: "pickup",      vehicleB: "panel_van", distance: "FAR",   distractors: 0, axes: 8 },
  { level: 4, stage: 1, name: "Desert Intermediate 1", background: "DESERT", vehicleA: "pickup",      vehicleB: "panel_van", distance: "MID", distractors: 0, axes: 8 },
  { level: 5, stage: 1, name: "Desert Intermediate 2", background: "DESERT", vehicleA: "coupe",       vehicleB: "convertible", distance: "FAR", distractors: 0, axes: 8 },

  // STAGE 2 (Farmland rolling pasture hills, up to 23 distractors, 8 radial axes)
  { level: 6, stage: 2, name: "Pasture Scout 1", background: "FARMLAND", vehicleA: "coupe",       vehicleB: "convertible", distance: "CLOSE", distractors: 6, axes: 8 },
  { level: 7, stage: 2, name: "Pasture Scout 2", background: "FARMLAND", vehicleA: "convertible", vehicleB: "roadster",    distance: "MID",   distractors: 12, axes: 8 },
  { level: 8, stage: 2, name: "Pasture Challenger 1", background: "FARMLAND", vehicleA: "convertible", vehicleB: "roadster",    distance: "FAR",   distractors: 16, axes: 8 },
  { level: 9, stage: 2, name: "Pasture Challenger 2", background: "FARMLAND", vehicleA: "pickup",      vehicleB: "roadster",    distance: "MID",   distractors: 20, axes: 8 },
  { level: 10, stage: 2, name: "Pasture Master", background: "FARMLAND", vehicleA: "roadster",    vehicleB: "wagon",       distance: "FAR",   distractors: 23, axes: 8 },

  // STAGE 3 (Forest silhouettes, up to 47 distractors, 16 radial axes)
  { level: 11, stage: 3, name: "Forest Elite 1", background: "FOREST", vehicleA: "pickup_rails", vehicleB: "pickup",      distance: "CLOSE", distractors: 15, axes: 16 },
  { level: 12, stage: 3, name: "Forest Elite 2", background: "FOREST", vehicleA: "coupe",        vehicleB: "roadster",    distance: "MID",   distractors: 25, axes: 16 },
  { level: 13, stage: 3, name: "Forest Master 1", background: "FOREST", vehicleA: "coupe",        vehicleB: "roadster",    distance: "FAR",   distractors: 35, axes: 16 },
  { level: 14, stage: 3, name: "Forest Master 2", background: "FOREST", vehicleA: "coupe",        vehicleB: "coupe_rack",  distance: "MID",   distractors: 43, axes: 16 },
  { level: 15, stage: 3, name: "UFOV Grandmaster", background: "FOREST", vehicleA: "coupe",        vehicleB: "coupe_rack",  distance: "FAR",   distractors: 47, axes: 16 }
];

// --- Dynamic Directions (8 or 16 Spokes) ---
export function getDirectionsForLevel() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  const count = currentLevel.axes || 8;
  const dirs = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    dirs.push({ index: i, angle: angle });
  }
  return dirs;
}

// --- Helper: Get Peripheral Target Radius ---
export function getPeripheralRadius() {
  const currentLevel = LEVEL_MATRIX[state.currentLevelIndex];
  if (currentLevel.distance === 'CLOSE') return RADIUS_CLOSE;
  if (currentLevel.distance === 'MID') return RADIUS_MID;
  return RADIUS_FAR;
}

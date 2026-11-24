// Pure world rules: island layout, walkable ground, movement. No React or three.js.
export const ISLAND_HALF = 4.5; // islands are 9x9 blocks
export const BRIDGE_HALF_WIDTH = 1;
export const WALK_SPEED = 4.5;
export const TALK_RADIUS = 2.2;

export interface Vec2 { x: number; z: number }

export function islandCenter(i: number): Vec2 {
  return { x: i * 14, z: i % 2 === 0 ? 0 : -7 };
}

/** Clip both ends across the full bridge width at the facing island edges. */
export function bridgeFootprint(i: number): [Vec2, Vec2, Vec2, Vec2] {
  const a = islandCenter(i), b = islandCenter(i + 1);
  const slope = (b.z - a.z) / (b.x - a.x);
  const startX = a.x + ISLAND_HALF;
  const endX = b.x - ISLAND_HALF;
  const startZ = a.z + slope * ISLAND_HALF;
  const endZ = b.z - slope * ISLAND_HALF;
  const halfZ = BRIDGE_HALF_WIDTH * Math.sqrt(1 + slope * slope);
  return [
    { x: startX, z: startZ - halfZ },
    { x: endX, z: endZ - halfZ },
    { x: endX, z: endZ + halfZ },
    { x: startX, z: startZ + halfZ },
  ];
}

export function villagerPos(i: number): Vec2 {
  const c = islandCenter(i);
  return { x: c.x + 1.5, z: c.z - 1.5 };
}

export const SPAWN: Vec2 = { x: islandCenter(0).x - 2, z: islandCenter(0).z + 2 };

function onIsland(p: Vec2, i: number): boolean {
  const c = islandCenter(i);
  return Math.abs(p.x - c.x) <= ISLAND_HALF - 0.3 && Math.abs(p.z - c.z) <= ISLAND_HALF - 0.3;
}

function onBridge(p: Vec2, i: number): boolean {
  const a = islandCenter(i), b = islandCenter(i + 1);
  const dx = b.x - a.x, dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  const t = ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2;
  if (t < 0 || t > 1) return false;
  const px = a.x + t * dx, pz = a.z + t * dz;
  return Math.hypot(p.x - px, p.z - pz) <= BRIDGE_HALF_WIDTH;
}

/** Bridge i (island i -> i+1) exists once island i is completed. */
export function isWalkable(p: Vec2, completed: ReadonlySet<number>, count: number): boolean {
  for (let i = 0; i < count; i++) {
    if (onIsland(p, i)) return true;
    if (i < count - 1 && completed.has(i) && onBridge(p, i)) return true;
  }
  return false;
}

/** Move with per-axis sliding so the player never walks off the edge. */
export function step(p: Vec2, dir: Vec2, dt: number, completed: ReadonlySet<number>, count: number): Vec2 {
  const len = Math.hypot(dir.x, dir.z);
  if (len === 0) return p;
  const s = (WALK_SPEED * Math.min(dt, 0.05)) / len;
  const full = { x: p.x + dir.x * s, z: p.z + dir.z * s };
  if (isWalkable(full, completed, count)) return full;
  const xOnly = { x: full.x, z: p.z };
  if (isWalkable(xOnly, completed, count)) return xOnly;
  const zOnly = { x: p.x, z: full.z };
  if (isWalkable(zOnly, completed, count)) return zOnly;
  return p;
}

export function nearestVillager(p: Vec2, count: number): number | null {
  for (let i = 0; i < count; i++) {
    const v = villagerPos(i);
    if (Math.hypot(p.x - v.x, p.z - v.z) <= TALK_RADIUS) return i;
  }
  return null;
}

/** An island's challenges unlock only after the previous island is done. */
export function isUnlocked(i: number, completed: ReadonlySet<number>): boolean {
  return i === 0 || completed.has(i - 1);
}

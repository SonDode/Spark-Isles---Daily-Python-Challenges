import { describe, expect, it } from "vitest";
import { bridgeFootprint, isUnlocked, isWalkable, islandCenter, step, SPAWN } from "./world";
import { ISLANDS } from "./content";

const N = ISLANDS.length;
const mid = () => { const a = islandCenter(0), b = islandCenter(1); return { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }; };

describe("world rules", () => {
  it("all five visible bridges stop exactly at the facing island edges", () => {
    for (let i = 0; i < 5; i++) {
      const points = bridgeFootprint(i);
      expect(points.map((p) => p.x)).toEqual([i * 14 + 4.5, (i + 1) * 14 - 4.5, (i + 1) * 14 - 4.5, i * 14 + 4.5]);
      for (const p of points) {
        expect(p.x).toBeGreaterThanOrEqual(islandCenter(i).x + 4.5);
        expect(p.x).toBeLessThanOrEqual(islandCenter(i + 1).x - 4.5);
      }
    }
  });
  it("has six islands, one per plan block", () => expect(N).toBe(6));
  it("spawn is walkable", () => expect(isWalkable(SPAWN, new Set(), N)).toBe(true));
  it("bridge to island 2 is missing until island 1 is done", () => {
    expect(isWalkable(mid(), new Set(), N)).toBe(false);
    expect(isWalkable(mid(), new Set([0]), N)).toBe(true);
  });
  it("cannot walk off the island edge", () => {
    let p = SPAWN;
    for (let k = 0; k < 200; k++) p = step(p, { x: 0, z: 1 }, 0.05, new Set(), N);
    expect(p.z).toBeLessThan(islandCenter(0).z + 4.5);
  });
  it("island 3 challenges stay locked until island 2 is done", () => {
    expect(isUnlocked(2, new Set([0]))).toBe(false);
    expect(isUnlocked(2, new Set([0, 1]))).toBe(true);
  });
});

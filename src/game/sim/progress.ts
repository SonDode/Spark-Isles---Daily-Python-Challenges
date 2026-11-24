// Pure progress rules. No React, no backend: easy to test.

/** Every page load and restart gets independent, empty run progress. */
export function createRunProgress(): Set<number> {
  return new Set<number>();
}

/** Keep only island indexes that could be real: whole numbers, 0 or above. */
function clean(values: Iterable<number>): number[] {
  const out: number[] = [];
  for (const v of values) {
    if (Number.isInteger(v) && v >= 0) out.push(v);
  }
  return out;
}

/**
 * Signing in must never cost a player islands they already cleared, so saved
 * progress is the union of what this browser had and what the account had.
 */
export function mergeProgress(local: Iterable<number>, server: Iterable<number>): number[] {
  const set = new Set<number>(clean(local));
  for (const v of clean(server)) set.add(v);
  return [...set].sort((a, b) => a - b);
}

/** Bridges appear only for islands already cleared, so a cleared island unlocks its neighbour. */
export function nextLockedIsland(completed: ReadonlySet<number>, total: number): number | null {
  for (let i = 0; i < total; i++) {
    if (!completed.has(i)) return i;
  }
  return null;
}

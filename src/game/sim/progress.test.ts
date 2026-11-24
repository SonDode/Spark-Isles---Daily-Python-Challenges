import { describe, expect, it } from "vitest";
import { createRunProgress, mergeProgress, nextLockedIsland } from "./progress";

describe("progress rules", () => {
  it("starts every new run at zero even after the previous run cleared islands", () => {
    const previous = createRunProgress();
    previous.add(0);
    previous.add(1);
    const refreshed = createRunProgress();
    expect([...refreshed]).toEqual([]);
    expect(nextLockedIsland(refreshed, 6)).toBe(0);
    expect([...previous]).toEqual([0, 1]);
  });
  it("keeps islands from both the browser and the account", () => {
    expect(mergeProgress([0, 1], [1, 2])).toEqual([0, 1, 2]);
  });

  it("never drops a browser-only island when the account has none", () => {
    expect(mergeProgress([0, 3], [])).toEqual([0, 3]);
  });

  it("never drops an account-only island when the browser is fresh", () => {
    expect(mergeProgress([], [2, 4])).toEqual([2, 4]);
  });

  it("lists each cleared island once, lowest first", () => {
    expect(mergeProgress([4, 0, 0], [0, 4, 2])).toEqual([0, 2, 4]);
  });

  it("ignores impossible island numbers", () => {
    expect(mergeProgress([-1, 1.5, 7], [Number.NaN, 3])).toEqual([7, 3].sort((a, b) => a - b));
  });

  it("reports the next island to clear, or none once all are done", () => {
    expect(nextLockedIsland(new Set([0, 1]), 6)).toBe(2);
    expect(nextLockedIsland(new Set([0, 1, 2, 3, 4, 5]), 6)).toBeNull();
  });
});

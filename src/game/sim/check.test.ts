import { describe, expect, it } from "vitest";
import { checkAnswer, shuffleLines } from "./check";
import { ISLANDS, type Challenge } from "./content";

describe("challenge rules", () => {
  it("the first five islands each have one exercise", () => {
    expect(ISLANDS.slice(0, 5).map((i) => i.challenges.length)).toEqual([1, 1, 1, 1, 1]);
  });
  it("islands 1-5 retain their respective exercise types", () => {
    expect(ISLANDS.slice(0, 5).map((i) => i.challenges[0]?.kind)).toEqual(["single", "multi", "reorder", "bug", "fill"]);
  });
  it("island 6 has five exercises, one of each type", () => {
    expect(ISLANDS[5]?.challenges.map((c) => c.kind)).toEqual(["single", "multi", "reorder", "bug", "fill"]);
  });
  it("reorder exercises have at most 6 lines", () => {
    for (const i of ISLANDS) for (const c of i.challenges) if (c.kind === "reorder") expect(c.lines.length).toBeLessThanOrEqual(6);
  });
  const multi: Challenge = { kind: "multi", prompt: "", explain: "", options: ["a", "b", "c"], answers: [0, 2] };
  it("multi needs exactly the right set", () => {
    expect(checkAnswer(multi, { kind: "multi", picked: [2, 0] })).toBe(true);
    expect(checkAnswer(multi, { kind: "multi", picked: [0] })).toBe(false);
    expect(checkAnswer(multi, { kind: "multi", picked: [0, 1, 2] })).toBe(false);
  });
  const re: Challenge = { kind: "reorder", prompt: "", explain: "", lines: ["a", "b", "c"] };
  it("reorder compares order", () => {
    expect(checkAnswer(re, { kind: "reorder", order: ["a", "b", "c"] })).toBe(true);
    expect(checkAnswer(re, { kind: "reorder", order: ["b", "a", "c"] })).toBe(false);
  });
  const fill: Challenge = { kind: "fill", prompt: "", explain: "", template: "___", blanks: [["for"]] };
  it("fill ignores surrounding spaces", () => {
    expect(checkAnswer(fill, { kind: "fill", values: ["  for "] })).toBe(true);
    expect(checkAnswer(fill, { kind: "fill", values: ["while"] })).toBe(false);
  });
  it("shuffle never returns the correct order", () => {
    for (let k = 0; k < 50; k++) expect(shuffleLines(["a", "b", "c"])).not.toEqual(["a", "b", "c"]);
  });
});

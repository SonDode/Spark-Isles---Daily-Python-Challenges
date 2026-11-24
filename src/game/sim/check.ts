import type { Challenge } from "./content";

export type Response =
  | { kind: "single"; picked: number }
  | { kind: "multi"; picked: number[] }
  | { kind: "reorder"; order: string[] }
  | { kind: "bug"; picked: number }
  | { kind: "fill"; values: string[] };

const norm = (s: string) => s.trim().replace(/'/g, '"');

export function checkAnswer(ch: Challenge, r: Response): boolean {
  switch (ch.kind) {
    case "single": return r.kind === "single" && r.picked === ch.answer;
    case "bug": return r.kind === "bug" && r.picked === ch.bugLine;
    case "multi": {
      if (r.kind !== "multi") return false;
      const a = new Set(ch.answers), p = new Set(r.picked);
      return a.size === p.size && [...a].every((x) => p.has(x));
    }
    case "reorder":
      return r.kind === "reorder" && r.order.length === ch.lines.length && r.order.every((l, i) => l === ch.lines[i]);
    case "fill":
      return r.kind === "fill" && ch.blanks.every((ok, i) => ok.some((v) => norm(v) === norm(r.values[i] ?? "")));
  }
}

/** Shuffles lines, never returning the original order (when that's possible). */
export function shuffleLines(lines: string[], rand: () => number = Math.random): string[] {
  if (lines.length < 2) return [...lines];
  for (let tries = 0; tries < 20; tries++) {
    const a = [...lines];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
    if (a.some((l, i) => l !== lines[i])) return a;
  }
  return [...lines.slice(1), lines[0]!];
}

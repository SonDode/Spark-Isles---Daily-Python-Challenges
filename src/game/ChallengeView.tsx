import { useState } from "react";
import type { Challenge } from "./sim/content";
import { checkAnswer, shuffleLines, type Response } from "./sim/check";

/** One exercise. Remount with a new key per question to reset its state. */
export function ChallengeView({ ch, index, total, onPass, onFail }: { ch: Challenge; index: number; total: number; onPass: () => void; onFail?: () => void }) {
  const [result, setResult] = useState<boolean | null>(null);
  const [multi, setMulti] = useState<number[]>([]);
  const [order, setOrder] = useState<string[]>(() => (ch.kind === "reorder" ? shuffleLines(ch.lines) : []));
  const [fills, setFills] = useState<string[]>(() => (ch.kind === "fill" ? ch.blanks.map(() => "") : []));
  const [picked, setPicked] = useState<number | null>(null);
  const answered = result !== null;

  const submit = (r: Response) => { const ok = checkAnswer(ch, r); setResult(ok); if (!ok) onFail?.(); };
  const retry = () => { setResult(null); setPicked(null); setMulti([]); if (ch.kind === "reorder") setOrder(shuffleLines(ch.lines)); };
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= order.length) return;
    const a = [...order]; [a[i], a[j]] = [a[j]!, a[i]!]; setOrder(a);
  };
  const codeBox = (code: string) => (
    <div className="mt-2">
      <span className="font-pixel text-[9px] text-game-accent">PYTHON</span>
      <pre className="mt-1 overflow-x-auto bg-game-code p-3 font-code text-sm text-game-code-ink">{code}</pre>
    </div>
  );
  const checkBtn = (onClick: () => void, disabled = false) => !answered && (
    <button className="game-btn game-btn-accent mt-3 w-full px-4 py-3 text-lg disabled:opacity-50" disabled={disabled} onClick={onClick}>Check</button>
  );

  return (
    <>
      <p className="mb-1 font-pixel text-[10px] text-game-ink-dim">Challenge {index + 1}/{total}</p>
      <p className="text-lg leading-snug">{ch.prompt}</p>

      {ch.kind === "single" && (
        <>
          {ch.code && codeBox(ch.code)}
          <div className="mt-3 grid gap-2">
            {ch.options.map((o, k) => {
              const st = !answered ? "" : k === picked ? (result ? "bg-game-success" : "bg-game-danger") : "opacity-60";
              return <button key={k} disabled={answered} onClick={() => { setPicked(k); submit({ kind: "single", picked: k }); }} className={`game-btn whitespace-pre-wrap px-3 py-2 text-left font-code text-sm ${st}`}>{o}</button>;
            })}
          </div>
        </>
      )}

      {ch.kind === "multi" && (
        <>
          {ch.code && codeBox(ch.code)}
          <p className="mt-1 text-sm text-game-ink-dim">Select all that apply.</p>
          <div className="mt-2 grid gap-2">
            {ch.options.map((o, k) => {
              const on = multi.includes(k);
              return (
                <button key={k} disabled={answered} aria-pressed={on}
                  onClick={() => setMulti(on ? multi.filter((x) => x !== k) : [...multi, k])}
                  className={`game-btn flex items-center gap-2 px-3 py-2 text-left font-code text-sm ${on ? "bg-game-accent" : ""}`}>
                  <span className="font-pixel text-xs">{on ? "[x]" : "[ ]"}</span>{o}
                </button>
              );
            })}
          </div>
          {checkBtn(() => submit({ kind: "multi", picked: multi }), multi.length === 0)}
        </>
      )}

      {ch.kind === "reorder" && (
        <>
          <div className="mt-3 grid gap-1">
            {order.map((l, i) => (
              <div key={l + i} className="flex items-center gap-1 bg-game-code">
                <pre className="flex-1 overflow-x-auto px-3 py-2 font-code text-sm text-game-code-ink">{l}</pre>
                <button className="game-btn px-2 py-1 text-sm" disabled={answered || i === 0} aria-label="Move up" onClick={() => move(i, -1)}>▲</button>
                <button className="game-btn px-2 py-1 text-sm" disabled={answered || i === order.length - 1} aria-label="Move down" onClick={() => move(i, 1)}>▼</button>
              </div>
            ))}
          </div>
          {checkBtn(() => submit({ kind: "reorder", order }))}
        </>
      )}

      {ch.kind === "bug" && (
        <div className="mt-3 grid gap-1">
          {ch.lines.map((l, k) => {
            const st = !answered ? "" : k === picked ? (result ? "bg-game-success" : "bg-game-danger") : "opacity-60";
            return (
              <button key={k} disabled={answered} onClick={() => { setPicked(k); submit({ kind: "bug", picked: k }); }}
                className={`game-btn flex gap-3 px-3 py-2 text-left font-code text-sm ${st}`}>
                <span className="text-game-ink-dim">{k + 1}</span><span className="whitespace-pre">{l}</span>
              </button>
            );
          })}
        </div>
      )}

      {ch.kind === "fill" && (() => {
        const parts = ch.template.split("___");
        return (
          <>
            <pre className="mt-3 overflow-x-auto bg-game-code p-3 font-code text-sm text-game-code-ink">
              {parts.map((p, i) => (
                <span key={i}>{p}{i < parts.length - 1 && (
                  <input aria-label={`Blank ${i + 1}`} value={fills[i] ?? ""} disabled={answered}
                    onChange={(e) => { const a = [...fills]; a[i] = e.target.value; setFills(a); }}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" && fills.every((f) => f.trim())) submit({ kind: "fill", values: fills }); }}
                    className="mx-1 w-24 border-b-2 border-game-accent bg-transparent px-1 font-code text-game-code-ink outline-none" />
                )}</span>
              ))}
            </pre>
            {checkBtn(() => submit({ kind: "fill", values: fills }), fills.some((f) => !f.trim()))}
          </>
        );
      })()}

      {answered && (
        <div className="mt-3">
          <p className={`font-pixel text-xs ${result ? "text-game-success" : "text-game-danger"}`}>{result ? "Correct!" : "Not quite."}</p>
          <p className="mt-1 leading-snug">{result ? ch.explain : "Take another look and try again."}</p>
          <button className="game-btn game-btn-accent mt-3 w-full px-4 py-3 text-lg" onClick={result ? onPass : retry}>{result ? "Continue" : "Try again"}</button>
        </div>
      )}
    </>
  );
}

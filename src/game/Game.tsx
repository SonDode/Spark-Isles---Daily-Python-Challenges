import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";
import { AuthPanel } from "./AuthPanel";
import { useAuthSession } from "./auth";
import { recordIslandCompletion } from "./progress.functions";
import { createRunProgress } from "./sim/progress";
import { DAILY_DAY } from "./sim/day";
import { ISLANDS } from "./sim/content";
import { isUnlocked, SPAWN, type Vec2 } from "./sim/world";
import { Scene, type Input } from "./Scene";
import { ChallengeView } from "./ChallengeView";
import { TitleScreen } from "./TitleScreen";
import { FinishScreen } from "./FinishScreen";
import { DeathScreen } from "./DeathScreen";

const MAX_HEARTS = 3;

type Dialog =
  | { kind: "locked"; island: number }
  | { kind: "intro"; island: number }
  | { kind: "quiz"; island: number; q: number }
  | { kind: "done"; island: number };

export default function Game() {
  const input = useRef<Input>({ x: 0, z: 0 });
  const posRef = useRef<Vec2>({ ...SPAWN });
  const keys = useRef(new Set<string>());
  const pad = useRef({ x: 0, z: 0 });
  const [completed, setCompleted] = useState<Set<number>>(createRunProgress);
  const [near, setNear] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [phase, setPhase] = useState<"title" | "playing" | "finished" | "dead">("title");
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [hurt, setHurt] = useState(0);
  const loseHeart = () => { setHurt((k) => k + 1); setHearts((h) => { const n = h - 1; if (n <= 0) { setTimeout(() => { setDialog(null); setPhase("dead"); }, 700); return 0; } return n; }); };
  const respawn = () => { reset(); setHearts(MAX_HEARTS); startedAt.current = Date.now(); setPhase("playing"); };
  const startedAt = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [weekly, setWeekly] = useState<number | null>(null);
  const { user } = useAuthSession();

  const refreshWeekly = useCallback(() => {
    supabase.rpc("islands_cleared_this_week").then(({ data }) => {
      if (typeof data === "number") setWeekly(data);
    });
  }, []);

  useEffect(() => { refreshWeekly(); }, [refreshWeekly]);

  const syncInput = () => {
    const k = keys.current;
    const x = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0) + pad.current.x;
    const z = (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0) + pad.current.z;
    input.current = { x: Math.max(-1, Math.min(1, x)), z: Math.max(-1, Math.min(1, z)) };
  };

  const talk = useCallback(() => {
    if (near === null) return;
    setShowHelp(false);
    if (completed.has(near)) setDialog({ kind: "done", island: near });
    else if (!isUnlocked(near, completed)) setDialog({ kind: "locked", island: near });
    else setDialog({ kind: "intro", island: near });
  }, [near, completed]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (phase !== "playing") return;
      if (dialog || authOpen) { if (k === "escape") { setDialog(null); setAuthOpen(false); } return; }
      if (k === "e" || k === "enter") { talk(); return; }
      keys.current.add(k); syncInput();
      if (k.startsWith("arrow")) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => { keys.current.delete(e.key.toLowerCase()); syncInput(); };
    const blur = () => { keys.current.clear(); syncInput(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [dialog, authOpen, talk, phase]);

  const nextQuestion = () => {
    if (dialog?.kind !== "quiz") return;
    const isl = ISLANDS[dialog.island]!;
    if (dialog.q + 1 < isl.challenges.length) { setDialog({ ...dialog, q: dialog.q + 1 }); return; }
    const s = new Set(completed); s.add(dialog.island);
    setCompleted(s);
    if (user) {
      recordIslandCompletion({ data: { island: dialog.island } })
        .then(refreshWeekly)
        .catch(() => { /* keep this run playable when completion recording is unavailable */ });
    }
    if (s.size === ISLANDS.length) {
      setDialog(null);
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
      setPhase("finished");
      return;
    }
    setDialog({ kind: "done", island: dialog.island });
  };

  const start = () => {
    startedAt.current = Date.now(); setPhase("playing"); setShowHelp(true);
    setTimeout(() => setShowHelp(false), 6000);
  };
  const backToMenu = () => { reset(); setHearts(MAX_HEARTS); setPhase("title"); };
  const exerciseCount = ISLANDS.reduce((n, i) => n + i.challenges.length, 0);

  const reset = () => { setCompleted(createRunProgress()); posRef.current = { ...SPAWN }; setDialog(null); };

  const setPad = (x: number, z: number) => { pad.current = { x, z }; syncInput(); };
  const padBtn = (label: string, x: number, z: number, cls: string) => (
    <button
      aria-label={label}
      className={`game-btn absolute flex h-14 w-14 touch-none select-none items-center justify-center font-pixel text-lg ${cls}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setPad(x, z); }}
      onPointerUp={() => setPad(0, 0)} onPointerCancel={() => setPad(0, 0)} onPointerLeave={() => setPad(0, 0)}
    >{label === "up" ? "▲" : label === "down" ? "▼" : label === "left" ? "◀" : "▶"}</button>
  );

  const allDone = completed.size === ISLANDS.length;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-game-code font-pixel-body text-game-ink" data-game-root>
      <Canvas shadows={{ type: THREE.PCFSoftShadowMap }} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }} dpr={[1, 2]} camera={{ fov: 50, position: [SPAWN.x, 9, SPAWN.z + 11] }}>
        <Scene input={input} paused={dialog !== null || authOpen || phase !== "playing"} attract={phase === "title"} completed={completed} onNear={setNear} posRef={posRef} hideBadges={dialog !== null || authOpen} />
      </Canvas>

      {phase === "title" && <TitleScreen onStart={start} />}
      {hurt > 0 && phase === "playing" && <div key={`hurt-${hurt}`} aria-hidden className="hurt-flash pointer-events-none absolute inset-0 z-40 flex items-center justify-center"><span className="hurt-heart font-pixel text-7xl text-game-danger">♥</span></div>}
      {phase === "dead" && <DeathScreen onRespawn={respawn} onMenu={backToMenu} />}
      {phase === "finished" && <FinishScreen islands={ISLANDS.length} exercises={exerciseCount} seconds={elapsed} onMenu={backToMenu} />}

      {/* Top HUD */}
      {phase === "playing" && <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="game-panel pointer-events-auto px-3 py-2">
          <h1 className="font-pixel text-xs leading-relaxed sm:text-sm">Spark Isles</h1>
          <p className="text-sm text-game-ink-dim">{DAILY_DAY} · Daily Python practice</p>
        </div>
        <div className="game-panel pointer-events-auto flex items-center gap-1 px-3 py-2" aria-label={`${hearts} hearts left`}>
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <span key={i === hearts ? `lost-${hurt}` : i} className={`font-pixel text-xl leading-none ${i < hearts ? "text-game-danger" : "text-game-ink-dim opacity-40"} ${i === hearts && hurt > 0 ? "heart-lost" : ""} ${i < hearts && hurt > 0 ? "heart-shake" : ""}`}>♥</span>
          ))}
        </div>
        <div className="flex flex-wrap items-start justify-end gap-2">
          <div className="game-panel pointer-events-auto flex items-center gap-2 px-3 py-2">
            <span className="text-sm">Islands</span>
            <div className="flex gap-1">
              {ISLANDS.map((i) => (
                <span key={i.id} title={i.name} className={`h-4 w-4 border-2 border-game-panel-edge ${completed.has(i.id) ? "bg-game-accent" : "bg-game-btn"}`} />
              ))}
            </div>
            <span className="font-pixel text-xs">{completed.size}/{ISLANDS.length}</span>
          </div>
          <div className="game-panel pointer-events-auto flex flex-wrap items-center gap-2 px-3 py-2">
            <span className="text-sm text-game-ink-dim">Cleared this week</span>
            <span className="font-pixel text-xs text-game-accent">{weekly === null ? "…" : weekly}</span>
            {user ? (
              <>
                <span className="max-w-[11rem] truncate text-sm text-game-ink-dim">{user.email ?? "Signed in"}</span>
                <button className="game-btn px-2 py-1 text-sm" onClick={() => supabase.auth.signOut()}>Sign out</button>
              </>
            ) : (
              <button className="game-btn game-btn-accent px-2 py-1 text-sm" onClick={() => setAuthOpen(true)}>Sign in</button>
            )}
          </div>
        </div>
      </div>}

      {phase === "playing" && showHelp && !dialog && !authOpen && (
        <div className="game-panel pop-in pointer-events-none absolute left-1/2 top-24 w-[min(92vw,24rem)] -translate-x-1/2 px-4 py-2 text-center">
          <p className="text-base leading-snug">Walk with <b>WASD</b> or arrows · press <b>E</b> to talk</p>
        </div>
      )}

      {/* Talk prompt */}
      {phase === "playing" && near !== null && !dialog && !authOpen && (
        <div className="absolute bottom-10 right-4 sm:bottom-8 sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
          <button className="game-btn game-btn-accent max-w-[11rem] px-4 py-3 text-base sm:max-w-none sm:text-lg" onClick={talk}>
            Talk <span className="hidden sm:inline">[E]</span>
          </button>
        </div>
      )}

      {/* Touch D-pad */}
      {phase === "playing" && !dialog && !authOpen && (
        <div className="absolute bottom-6 left-6 h-44 w-44 sm:hidden">
          {padBtn("up", 0, -1, "left-[60px] top-0")}
          {padBtn("down", 0, 1, "bottom-0 left-[60px]")}
          {padBtn("left", -1, 0, "left-0 top-[60px]")}
          {padBtn("right", 1, 0, "right-0 top-[60px]")}
        </div>
      )}

      {/* Dialog */}
      {dialog && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-game-panel-edge/40 p-3 sm:items-center" onClick={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div role="dialog" aria-modal="true" className="game-panel max-h-[85dvh] w-full max-w-xl overflow-y-auto p-4 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-pixel text-[10px] leading-relaxed text-game-accent sm:text-xs">{ISLANDS[dialog.island]!.name}</p>
              </div>
              <button className="game-btn px-3 py-1 text-base" onClick={() => setDialog(null)} aria-label="Close">✕</button>
            </div>

            {dialog.kind === "locked" && (
              <p className="text-lg leading-snug">"Not yet, traveler. Clear <b>{ISLANDS[dialog.island - 1]!.name}</b> first, then the bridge will lead you here."</p>
            )}

            {dialog.kind === "intro" && (
              <>
                <p className="text-lg leading-snug">"{ISLANDS[dialog.island]!.intro}"</p>
                <p className="mt-2 text-game-ink-dim">{ISLANDS[dialog.island]!.challenges.length} challenges · {ISLANDS[dialog.island]!.topic}</p>
                <button className="game-btn game-btn-accent mt-4 w-full px-4 py-3 text-lg" onClick={() => setDialog({ kind: "quiz", island: dialog.island, q: 0 })}>Start challenge</button>
              </>
            )}

            {dialog.kind === "quiz" && (
              <ChallengeView key={`${dialog.island}-${dialog.q}`} ch={ISLANDS[dialog.island]!.challenges[dialog.q]!}
                index={dialog.q} total={ISLANDS[dialog.island]!.challenges.length} onPass={nextQuestion} onFail={loseHeart} />
            )}

            {dialog.kind === "done" && (
              <>
                <p className="font-pixel text-sm leading-relaxed text-game-success">Island cleared!</p>
                <p className="mt-2 text-lg leading-snug">
                  {allDone ? "You've cleared every island. Great Python practice today. Come back tomorrow!" : dialog.island < ISLANDS.length - 1 ? `A bridge now leads to ${ISLANDS[dialog.island + 1]!.name}. Follow the planks!` : "Clear the remaining islands to finish your journey."}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="game-btn game-btn-accent flex-1 px-4 py-3 text-lg" onClick={() => setDialog(null)}>Continue exploring</button>
                  {allDone && <button className="game-btn px-4 py-3 text-lg" onClick={reset}>Play again</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

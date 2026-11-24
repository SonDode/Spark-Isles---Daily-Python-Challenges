import { useEffect, useMemo, useState } from "react";
import { DAILY_DAY, DAILY_DAY_INDEX, DAILY_DAY_LETTERS } from "@/game/sim/day";

function useCount(to: number, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now(); let id = 0;
    const tick = () => { const p = Math.min(1, (performance.now() - t0) / ms); setV(Math.round(to * (1 - (1 - p) ** 3))); if (p < 1) id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id);
  }, [to, ms]);
  return v;
}

const COLORS = ["var(--confetti-1)", "var(--confetti-2)", "var(--confetti-3)", "var(--confetti-4)", "var(--confetti-5)"];
const LOOT = [
  { icon: "💎", name: "Diamond" }, { icon: "🍎", name: "Golden Apple" }, { icon: "📖", name: "Enchanted Book" },
  { icon: "🗡️", name: "Diamond Sword" }, { icon: "⛏️", name: "Netherite Pickaxe" }, { icon: "🥚", name: "Dragon Egg" }, { icon: "🧪", name: "Potion of Python" },
];

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="stat-slide game-panel flex w-full flex-col items-center gap-3 px-6 py-8">
      <div className="trophy-bounce text-6xl">{icon}</div>
      <p className="text-xl text-game-ink-dim">{label}</p>
      <p className="font-pixel text-4xl text-game-accent">{value}</p>
    </div>
  );
}

function Count({ to, fmt, ...rest }: { to: number; fmt: (n: number) => string; label: string; icon: string }) {
  const v = useCount(to);
  return <StatCard {...rest} value={fmt(v)} />;
}

export function FinishScreen({ islands, exercises, seconds, onMenu }: { islands: number; exercises: number; seconds: number; onMenu: () => void }) {
  const pieces = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 2.5, dur: 2.5 + Math.random() * 2.5, size: 6 + Math.round(Math.random() * 3) * 3, color: COLORS[i % COLORS.length]!,
  })), []);
  const loot = useMemo(() => LOOT[Math.floor(Math.random() * LOOT.length)]!, []);
  const [step, setStep] = useState(0);
  const [fill, setFill] = useState(0);
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState(false);
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const stats = [
    { label: "Islands cleared", icon: "🏝️", to: islands, fmt: (n: number) => `${n}/${islands}` },
    { label: "Exercises solved", icon: "🐍", to: exercises, fmt: (n: number) => String(n) },
    { label: "Total time", icon: "⏱️", to: seconds, fmt: fmtTime },
  ];
  const onChest = step === stats.length;
  useEffect(() => {
    if (!onChest) return;
    const t0 = performance.now(); let id = 0;
    const tick = () => { const p = Math.min(1, (performance.now() - t0) / 1800); setFill(p); if (p < 1) id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id);
  }, [onChest]);
  const full = fill >= 1;
  const stat = stats[step];

  return (
    <div className="finish-screen absolute inset-0 z-30 flex items-center justify-center overflow-hidden p-4" role="dialog" aria-modal="true"
      onClick={() => { if (!onChest) setStep((s) => s + 1); }}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {pieces.map((p, i) => (
          <span key={i} className="confetti" style={{ left: `${p.left}%`, width: p.size, height: p.size, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
        ))}
        {open && <div className="star-burst" />}
      </div>
      <div className="relative flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <h2 className="pop-in font-pixel text-lg leading-relaxed text-game-accent sm:text-2xl">Daily challenge<br />complete!</h2>
        <div className="flex gap-2" aria-label={`Step ${step + 1} of ${stats.length + 1}`}>
          {[...stats, null].map((_, i) => <span key={i} className={`h-2 w-6 ${i <= step ? "bg-game-accent" : "bg-game-ink-dim/40"}`} />)}
        </div>
        {stat && <><Count key={step} label={stat.label} icon={stat.icon} to={stat.to} fmt={stat.fmt} /><p className="animate-pulse text-lg text-game-ink-dim">Tap to continue ▸</p></>}
        {onChest && (
          <div className="stat-slide flex w-full flex-col items-center gap-4">
            {streak ? (
              <div className="stat-slide flex w-full flex-col items-center gap-4">
                <div className="streak-fire text-8xl" aria-hidden>🔥</div>
                <p className="streak-num font-pixel text-5xl text-game-accent">1</p>
                <p className="font-pixel text-base text-game-accent">Day streak!</p>
                <p className="font-pixel text-xs text-game-ink-dim">{DAILY_DAY}</p>
                <div className="flex gap-1.5">
                  {DAILY_DAY_LETTERS.map((d, i) => (
                    <span key={i} className={`flex h-9 w-9 items-center justify-center font-pixel text-xs ${i === DAILY_DAY_INDEX ? "streak-day bg-game-accent text-game-accent-ink" : "game-panel text-game-ink-dim"}`}>{d}</span>
                  ))}
                </div>
                <p className="text-xl leading-snug">Come back tomorrow for a new challenge!</p>
                <button className="stone-btn w-full px-6 py-3 text-xl" onClick={onMenu}>Back to menu</button>
              </div>
            ) : !open ? (
              <>
                <button className={`chest ${full ? "chest-ready" : ""}`} disabled={!full} onClick={() => setOpen(true)} aria-label="Open chest">
                  <span className="chest-lid" /><span className="chest-body" /><span className="chest-lock" />
                </button>
                <div className="game-panel h-5 w-full overflow-hidden p-0.5">
                  <div className="h-full bg-game-success" style={{ width: `${fill * 100}%` }} />
                </div>
                <p className="text-xl">{full ? "Your chest is full! Tap to open it" : "Filling your daily chest..."}</p>
              </>
            ) : (
              <>
                <div className="loot-pop text-8xl">{loot.icon}</div>
                <p className="font-pixel text-base text-game-accent">You got: {loot.name}!</p>
                <button className="stone-btn w-full px-6 py-3 text-xl" onClick={() => setStreak(true)}>Continue</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

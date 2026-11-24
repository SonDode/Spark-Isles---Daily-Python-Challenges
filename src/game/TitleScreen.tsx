import { useState } from "react";
import { DAILY_DAY } from "@/game/sim/day";

const SPLASHES = ["Daily Python!", "print('hi')!", "Now with lists!", "Indent wisely!", "100% snake-powered!", "One island a day!"];

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const [splash] = useState(() => SPLASHES[Math.floor(Math.random() * SPLASHES.length)]!);
  const [leaving, setLeaving] = useState(false);
  return (
    <div className={`title-screen absolute inset-0 z-20 flex flex-col items-center justify-center gap-10 p-6 ${leaving ? "title-leave" : ""}`}>
      <div className="relative text-center">
        <h1 className="title-logo font-pixel text-4xl leading-tight sm:text-7xl">SPARK<br />ISLES</h1>
        <span className="splash-text absolute -right-4 bottom-0 font-pixel text-[10px] sm:-right-16 sm:text-sm">{splash}</span>
      </div>
      <p className="game-panel -mt-4 px-4 py-2 font-pixel text-xs text-game-accent sm:text-sm">{DAILY_DAY} daily challenge</p>
      <button className="stone-btn w-[min(90vw,26rem)] px-6 py-4 font-pixel-body text-xl sm:text-2xl"
        onClick={() => { setLeaving(true); setTimeout(onStart, 450); }}>
        Make the daily challenge
      </button>
      <p className="absolute bottom-3 left-3 text-sm text-game-ink-dim">Spark Isles · {DAILY_DAY} daily Python practice</p>
    </div>
  );
}

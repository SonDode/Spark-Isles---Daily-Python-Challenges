export function DeathScreen({ onRespawn, onMenu }: { onRespawn: () => void; onMenu: () => void }) {
  return (
    <div className="death-screen absolute inset-0 z-30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <h2 className="death-title font-pixel text-3xl leading-relaxed sm:text-5xl">You died!</h2>
        <p className="text-xl text-game-ink">You ran out of hearts.</p>
        <button className="stone-btn w-full px-6 py-3 text-xl" onClick={onRespawn}>Respawn</button>
        <button className="stone-btn w-full px-6 py-3 text-xl" onClick={onMenu}>Title screen</button>
      </div>
    </div>
  );
}

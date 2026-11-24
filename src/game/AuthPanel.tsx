import { useState } from "react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const GOOGLE_DARK = {
  backgroundColor: "#131314",
  borderColor: "#8E918F",
  color: "#E3E3E3",
} as const;

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={18}
      height={18}
    >
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

export function AuthPanel({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const social = async (provider: "google" | "lovable") => {
    setBusy(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) setError(result.error.message || "That sign-in did not work.");
      else if (result.redirected) return;
      else onClose();
    } catch {
      setError("That sign-in did not work.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (mode: "signup" | "signin") => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error: e } = await supabase.auth.signUp({ email, password });
        if (e) setError(e.message);
        else if (!data.session) setNotice("Check your email and confirm your account, then sign in here.");
        else onClose();
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) setError(e.message);
        else onClose();
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 flex items-end justify-center bg-game-panel-edge/40 p-3 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="Sign in" className="game-panel max-h-[85dvh] w-full max-w-md overflow-y-auto p-4 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-pixel text-[10px] leading-relaxed text-game-accent sm:text-xs">Sign in</p>
            <p className="text-lg">Join the Python practice</p>
          </div>
          <button className="game-btn px-3 py-1 text-base" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => social("google")}
            style={GOOGLE_DARK}
            className="h-auto w-full justify-center gap-[10px] rounded-none px-3 py-2"
          >
            <span style={{ display: "inline-flex", paddingLeft: 2, paddingRight: 2 }}>
              <GoogleLogo />
            </span>
            <span style={{ fontFamily: "var(--font-pixel-body)", fontSize: 14, lineHeight: "20px", fontWeight: 500 }}>
              Continue with Google
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => social("lovable")}
            className="h-auto w-full justify-center gap-[10px] rounded-none border-game-panel-edge bg-game-btn px-3 py-2 text-game-ink hover:bg-game-btn-hover hover:text-game-ink"
          >
            <LovableMark />
            <span style={{ fontFamily: "var(--font-pixel-body)", fontSize: 14, lineHeight: "20px", fontWeight: 500 }}>
              Continue with Lovable
            </span>
          </Button>
        </div>

        <p className="mt-4 font-pixel text-[9px] text-game-ink-dim">OR WITH EMAIL</p>

        <div className="mt-2 grid gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email"
            className="game-btn w-full rounded-none bg-game-code px-3 py-2 text-left font-code text-sm text-game-ink placeholder:text-game-ink-dim"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            aria-label="Password"
            className="game-btn w-full rounded-none bg-game-code px-3 py-2 text-left font-code text-sm text-game-ink placeholder:text-game-ink-dim"
          />
          <div className="flex gap-2">
            <button className="game-btn game-btn-accent flex-1 px-3 py-2 text-base disabled:opacity-60" disabled={busy} onClick={() => submit("signup")}>
              Create account
            </button>
            <button className="game-btn flex-1 px-3 py-2 text-base disabled:opacity-60" disabled={busy} onClick={() => submit("signin")}>
              Sign in
            </button>
          </div>
        </div>

        {notice && <p className="mt-3 text-base leading-snug text-game-success">{notice}</p>}
        {error && <p className="mt-3 text-base leading-snug text-game-danger">{error}</p>}
        <p className="mt-3 text-sm leading-snug text-game-ink-dim">
          You can play without an account. Each page reload starts a fresh journey.
        </p>
      </div>
    </div>
  );
}

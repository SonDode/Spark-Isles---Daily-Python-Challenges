import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SessionUser {
  id: string;
  email: string | null;
}

/** One subscription for the whole app: the signed-in player, or null. */
export function useAuthSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      setUser(session ? { id: session.user.id, email: session.user.email ?? null } : null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUser(session ? { id: session.user.id, email: session.user.email ?? null } : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}

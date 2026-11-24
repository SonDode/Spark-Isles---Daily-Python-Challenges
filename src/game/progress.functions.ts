import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Islands this player has cleared, read with their own session so row-level
 * security limits the query to their rows.
 */
export const getMyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("island_completions")
      .select("island_id")
      .order("island_id", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.island_id);
  });

/**
 * Records one cleared island for the signed-in player. The first clear wins:
 * a repeat insert is ignored so the original clear time is what the weekly
 * count uses.
 */
export const recordIslandCompletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { island: number }) => input)
  .handler(async ({ data, context }) => {
    const island = data.island;
    if (!Number.isInteger(island) || island < 0) throw new Error("Invalid island");
    // completed_at is left out on purpose: a new row takes the database's own
    // "now", and a row that already exists keeps the time of the first clear.
    const { error } = await context.supabase
      .from("island_completions")
      .upsert({ user_id: context.userId, island_id: island }, { onConflict: "user_id,island_id" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

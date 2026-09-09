import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once a real Supabase project is wired up via env vars. */
export const supabaseConfigured = Boolean(url && anonKey);

/**
 * Lazily-created Supabase client, `null` when NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY aren't set (e.g. local dev before you've
 * created a project, or a preview deploy without the env vars configured
 * yet). Callers should fall back to the bundled JSON snapshot in that case
 * — see lib/data.ts.
 */
export const supabase = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null;

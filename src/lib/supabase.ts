import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error("Faltam VITE_SUPABASE_URL e/ou VITE_SUPABASE_PUBLISHABLE_KEY (ver .env.example).");
}

export const supabase = createClient(url, key, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
});

import { createClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, so this file must never be
// imported from a Client Component.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

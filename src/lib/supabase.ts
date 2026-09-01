import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env['VITE_SUPABASE_URL'] ||
  "https://sites-blank-editor-supabase.ickanz.easypanel.host";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  "sb_publishable_GUOXkj-e-p-h2KcEAZr1aL_n1R8noel";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

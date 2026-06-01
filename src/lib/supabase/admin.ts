import { createClient as createSb } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client — bypasses RLS. SERVER ONLY. Used by the sync job and the
 * scoring engine to write fixtures/scores/standings. Never import from client code.
 */
export function createAdminClient() {
  return createSb<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

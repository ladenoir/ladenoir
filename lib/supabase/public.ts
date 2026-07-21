import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous, cookie-free Supabase client for public reads.
 *
 * `lib/supabase/server.ts`'s `createClient()` reads the request's auth
 * cookie via `next/headers`, which makes it a runtime-only API — it cannot
 * be called from inside an `unstable_cache` (or `"use cache"`) scope, since
 * cached functions are not allowed to depend on per-request data.
 *
 * Product/category catalog reads (status = "Live") are public and carry no
 * per-user state, so they can safely go through a plain client instead and
 * be cached across requests.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

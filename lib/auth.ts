"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServer() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Read cookie (for auth)
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // These are required by the type, but in server actions and
        // server components they won't really be used.
        set() {
          // no-op for now
        },
        remove() {
          // no-op for now
        },
      },
    }
  );

  return supabase;
}

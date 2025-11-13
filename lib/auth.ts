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
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Supabase uses this to persist the session
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          // Clear the cookie by setting empty value
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  return supabase;
}

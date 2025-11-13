"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishLogin() {
      if (typeof window === "undefined") return;

      // URL looks like: /auth/callback#access_token=...&refresh_token=...&type=magiclink...
      const hash = window.location.hash;
      if (!hash || !hash.startsWith("#")) {
        router.replace("/auth/login");
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        router.replace("/auth/login");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error("setSession error", error);
        router.replace("/auth/login");
      } else {
        // session + cookies are now set
        router.replace("/icc");
      }
    }

    finishLogin();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <p className="text-text2">Finishing login…</p>
    </div>
  );
}

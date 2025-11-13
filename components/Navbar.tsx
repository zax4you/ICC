"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/Button";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <nav className="border-b border-border px-4 py-3 flex items-center justify-between bg-bg2">
      <Link href="/" className="font-semibold text-lg">
        ICC App
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/icc">ICC</Link>
        <Link href="/confluence">Confluence</Link>
        <Link href="/history">History</Link>
		<Link href="/settings">Settings</Link>

        {!user && (
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        )}

        {user && (
          <Button type="button" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </div>
    </nav>
  );
}

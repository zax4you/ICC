"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (!error) setSent(true);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 rounded-xl bg-bg2 border border-border">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>

      {sent ? (
        <p className="text-text2">
          A magic login link has been sent to <strong>{email}</strong>.
        </p>
      ) : (
        <>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            className="w-full mt-4"
            loading={loading}
            onClick={handleLogin}
          >
            Send Magic Link
          </Button>
        </>
      )}
    </div>
  );
}

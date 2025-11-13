"use server";

import { createSupabaseServer } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function saveConfluence({
  weekly,
  daily,
  h4,
  h2_1h_30m,
  lower_tf,
  total,
}: {
  weekly: number;
  daily: number;
  h4: number;
  h2_1h_30m: number;
  lower_tf: number;
  total: number;
}) {
  // ✅ Wait for the Supabase server client
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not logged in");

  const { error } = await supabase.from("confluence_logs").insert({
    user_id: user.id,
    weekly_percent: weekly,
    daily_percent: daily,
    h4_percent: h4,
    h2_1h_30m_percent: h2_1h_30m,
    lower_tf_percent: lower_tf,
    overall_percent: total,
  });

  if (error) throw new Error(error.message);

  redirect("/history");
}

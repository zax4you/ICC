// lib/iccSettings.ts
import { supabase } from "@/lib/supabaseClient";

export type ICCSettings = {
  min_score: number;
  min_rr: number;
  default_risk_percent: number;
  daily_weight: number;
  h4_weight: number;
  h1_weight: number;
  m15_weight: number;
};

export const defaultICCSettings: ICCSettings = {
  min_score: 60,
  min_rr: 2,
  default_risk_percent: 10,
  daily_weight: 10,
  h4_weight: 10,
  h1_weight: 10,
  m15_weight: 5,
};

export async function fetchICCSettings(): Promise<ICCSettings> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return defaultICCSettings;

  const { data, error } = await supabase
    .from("icc_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return defaultICCSettings;

  return {
    ...defaultICCSettings,
    ...data,
  };
}

export async function saveICCSettings(settings: ICCSettings) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase.from("icc_settings").upsert(
    {
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ICCRecord = {
  id: string;
  pair: string;
  direction: "LONG" | "SHORT";
  indication_type: string | null;
  created_at: string;
};

type Parsed = {
  trendScore: number | null;
  iccScore: number | null;
  finalScore: number | null;
  indicationYes: boolean;
  correctionYes: boolean;
  continuationYes: boolean;
};

function parseICC(indication_type: string | null): Parsed {
  const base: Parsed = {
    trendScore: null,
    iccScore: null,
    finalScore: null,
    indicationYes: false,
    correctionYes: false,
    continuationYes: false,
  };

  if (!indication_type) return base;

  const parts = indication_type.split("|").map((p) => p.trim());

  for (const p of parts) {
    if (p.startsWith("Indication:")) {
      base.indicationYes = p.includes("YES");
    }
    if (p.startsWith("Correction:")) {
      base.correctionYes = p.includes("YES");
    }
    if (p.startsWith("Continuation:")) {
      base.continuationYes = p.includes("YES");
    }
    if (p.startsWith("TrendScore:")) {
      const n = parseInt(p.replace("TrendScore:", "").trim(), 10);
      if (!Number.isNaN(n)) base.trendScore = n;
    }
    if (p.startsWith("ICCScore:")) {
      const n = parseInt(p.replace("ICCScore:", "").trim(), 10);
      if (!Number.isNaN(n)) base.iccScore = n;
    }
    if (p.startsWith("FinalScore:")) {
      const n = parseInt(p.replace("FinalScore:", "").trim(), 10);
      if (!Number.isNaN(n)) base.finalScore = n;
    }
  }

  return base;
}

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<(ICCRecord & { parsed: Parsed })[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("icc_setups")
        .select("id, pair, direction, indication_type, created_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const enriched =
        data?.map((rec) => ({
          ...rec,
          parsed: parseICC(rec.indication_type),
        })) ?? [];

      setRecords(enriched);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return <p className="p-4 text-text2">Loading history…</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Your ICC History</h1>

      {records.length === 0 && (
        <p className="text-text2">No ICC setups saved yet.</p>
      )}

      <div className="space-y-4">
        {records.map((rec) => {
          const { parsed } = rec;
          const labelColor =
            parsed.finalScore == null
              ? "text-text2"
              : parsed.finalScore < 34
              ? "text-red-400"
              : parsed.finalScore < 67
              ? "text-yellow-400"
              : "text-green-400";

          return (
            <div
              key={rec.id}
              className="p-4 rounded-lg bg-bg2 border border-border"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold text-sm">
                    {rec.pair} · {rec.direction}
                  </p>
                  <p className="text-xs text-text3">
                    {new Date(rec.created_at).toLocaleString()}
                  </p>
                </div>
                {parsed.finalScore != null && (
                  <div className="text-right">
                    <p className="text-xs text-text2">Final score</p>
                    <p className={`text-lg font-semibold ${labelColor}`}>
                      {parsed.finalScore}%
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2 md:grid-cols-3 text-xs text-text2 mt-2">
                <p>
                  <span className="font-semibold">Trend score:</span>{" "}
                  {parsed.trendScore ?? "—"}%
                </p>
                <p>
                  <span className="font-semibold">ICC score:</span>{" "}
                  {parsed.iccScore ?? "—"}%
                </p>
                <p>
                  <span className="font-semibold">Ind / Corr / Cont:</span>{" "}
                  {parsed.indicationYes ? "Y" : "N"} /{" "}
                  {parsed.correctionYes ? "Y" : "N"} /{" "}
                  {parsed.continuationYes ? "Y" : "N"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

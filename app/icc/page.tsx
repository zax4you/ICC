"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Toggle from "@/components/Toggle";
import { supabase } from "@/lib/supabaseClient";
import {
  ICCSettings,
  defaultICCSettings,
  fetchICCSettings,
} from "@/lib/iccSettings";

type Direction = "LONG" | "SHORT";
type SetupType = "TREND" | "KEY_LEVEL";

const PAIRS = [
  "XAUUSD",
  "NAS100",
  "US30",
  "BTCUSD",
  "SOLUSD",
  "SPX500",
  "EURUSD",
] as const;

type Pair = (typeof PAIRS)[number];

const HTF_OPTIONS = ["4H", "Daily", "Weekly"];
const LTF_OPTIONS = ["5m", "15m", "30m"];

// Per-pair pip & contract assumptions (adjust these to your broker)
const PAIR_SETTINGS: Record<
  Pair,
  {
    pipValuePerLot: number;
    contractSize: number;
    pipSize: number;
    pipNote: string;
  }
> = {
  XAUUSD: {
    pipValuePerLot: 1,
    contractSize: 100,
    pipSize: 0.1, // 0.1 price move = 1 "point"
    pipNote:
      "Assuming 0.1 move on XAUUSD ≈ 1 point and ≈ $1 per lot (adjust to your broker).",
  },
  NAS100: {
    pipValuePerLot: 1,
    contractSize: 1,
    pipSize: 1,
    pipNote: "Assuming 1 index point ≈ $1 per lot on NAS100.",
  },
  US30: {
    pipValuePerLot: 1,
    contractSize: 1,
    pipSize: 1,
    pipNote: "Assuming 1 index point ≈ $1 per lot on US30.",
  },
  BTCUSD: {
    pipValuePerLot: 1,
    contractSize: 1,
    pipSize: 1,
    pipNote: "Assuming a $1 move ≈ $1 per lot on BTCUSD.",
  },
  SOLUSD: {
    pipValuePerLot: 1,
    contractSize: 1,
    pipSize: 0.1,
    pipNote: "Assuming a $0.1 move ≈ 1 point on SOLUSD.",
  },
  SPX500: {
    pipValuePerLot: 1,
    contractSize: 1,
    pipSize: 1,
    pipNote: "Assuming 1 index point ≈ $1 per lot on SPX500.",
  },
  EURUSD: {
    pipValuePerLot: 10, // 1 pip ≈ $10 per 1.00 lot
    contractSize: 100_000,
    pipSize: 0.0001,
    pipNote: "Assuming 1 pip ≈ $10 per 1.00 lot on EURUSD.",
  },
};

type TrendState = "BULLISH" | "BEARISH" | "CONSOLIDATING" | null;

export default function ICCPage() {
  // ────────────────────────────────────────────────
  // Settings
  // ────────────────────────────────────────────────
  const [settings, setSettings] =
    useState<ICCSettings>(defaultICCSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    fetchICCSettings()
      .then((s) => setSettings(s))
      .finally(() => setSettingsLoading(false));
  }, []);

  // ────────────────────────────────────────────────
  // Base trade info
  // ────────────────────────────────────────────────
  const [pair, setPair] = useState<Pair>("XAUUSD");
  const [customPair, setCustomPair] = useState("");
  const [direction, setDirection] = useState<Direction>("LONG");
  const [setupType, setSetupType] = useState<SetupType>("TREND");

  const [htf, setHtf] = useState("4H");
  const [ltf, setLtf] = useState("15m");

  // Trend per timeframe
  const [dailyTrend, setDailyTrend] = useState<TrendState>(null);
  const [h4Trend, setH4Trend] = useState<TrendState>(null);
  const [h1Trend, setH1Trend] = useState<TrendState>(null);
  const [m15Trend, setM15Trend] = useState<TrendState>(null);

  // ICC core
  const [hasIndication, setHasIndication] = useState(false);
  const [hasCorrection, setHasCorrection] = useState(false);
  const [hasContinuation, setHasContinuation] = useState(false);
  const [usesHTFKeyLevel, setUsesHTFKeyLevel] = useState(false);

  // Prices
  const [indicationPrice, setIndicationPrice] = useState<number | "">(
    ""
  );
  const [slPrice, setSlPrice] = useState<number | "">("");
  const [tpPrice, setTpPrice] = useState<number | "">("");

  // Position sizing inputs (step 3)
  const [accountSize, setAccountSize] = useState<number | "">("");
  const [riskPercent, setRiskPercent] = useState<number | "">("");
  const [stopLossPips, setStopLossPips] = useState<number | "">("");

  const [saving, setSaving] = useState(false);

  // Apply default risk from settings when loaded
  useEffect(() => {
    if (!settingsLoading) {
      setRiskPercent(settings.default_risk_percent as any);
    }
  }, [settingsLoading, settings]);

  // ────────────────────────────────────────────────
  // Trend scoring
  // ────────────────────────────────────────────────
  function scoreTrend(choice: TrendState, weight: number): number {
    if (!choice || choice === "CONSOLIDATING") return 0;
    const isBull = choice === "BULLISH";
    const aligned =
      (isBull && direction === "LONG") ||
      (!isBull && direction === "SHORT");
    return aligned ? weight : 0;
  }

  const trendScore =
    scoreTrend(dailyTrend, settings.daily_weight) +
    scoreTrend(h4Trend, settings.h4_weight) +
    scoreTrend(h1Trend, settings.h1_weight) +
    scoreTrend(m15Trend, settings.m15_weight);

  // ────────────────────────────────────────────────
  // ICC score
  // ────────────────────────────────────────────────
  const indicationScore = hasIndication ? 25 : 0;
  const correctionScore = hasCorrection ? 25 : 0;
  const continuationScore = hasContinuation ? 25 : 0;
  const iccScore = indicationScore + correctionScore + continuationScore;

  const rawTotal = trendScore + iccScore;
  const finalScore = rawTotal > 100 ? 100 : rawTotal;

  const levelLabel =
    finalScore < 34
      ? "Avoid this trade"
      : finalScore < 67
      ? "Medium quality"
      : "High probability ICC trade";

  const levelColor =
    finalScore < 34
      ? "text-red-400"
      : finalScore < 67
      ? "text-yellow-400"
      : "text-green-400";

  // ────────────────────────────────────────────────
  // Price conversions & R:R
  // ────────────────────────────────────────────────
  const indPrice =
    typeof indicationPrice === "number" ? indicationPrice : null;
  const sl = typeof slPrice === "number" ? slPrice : null;
  const tp = typeof tpPrice === "number" ? tpPrice : null;

  let riskPoints: number | null = null;
  let rewardPoints: number | null = null;
  let rr: number | null = null;

  if (indPrice != null && sl != null && tp != null) {
    if (direction === "LONG") {
      riskPoints = indPrice - sl;
      rewardPoints = tp - indPrice;
    } else {
      riskPoints = sl - indPrice;
      rewardPoints = indPrice - tp;
    }

    if (riskPoints > 0 && rewardPoints > 0) {
      rr = rewardPoints / riskPoints;
    }
  }

  let rrLabel = "";
  let rrColor = "text-text2";

  if (rr != null) {
    if (rr < settings.min_rr) {
      rrLabel = `Below ${settings.min_rr}R (does not meet your minimum)`;
      rrColor = "text-red-400";
    } else if (rr < settings.min_rr + 1) {
      rrLabel = `OK (> ${settings.min_rr}R but below your ideal 3R–4R)`;
      rrColor = "text-yellow-400";
    } else if (rr <= 4.5) {
      rrLabel = "Within your ideal 3R–4R zone";
      rrColor = "text-green-400";
    } else {
      rrLabel = "Very high RR – make sure TP is realistic";
      rrColor = "text-blue-400";
    }
  }
  
	// ────────────────────────────────────────────────
	// Trade grade (A+ .. D) – based only on ICC score
	// ────────────────────────────────────────────────
	let grade: "A+" | "A" | "B" | "C" | "D" = "D";

	if (finalScore >= 90) {
	  grade = "A+";
	} else if (finalScore >= 80) {
	  grade = "A";
	} else if (finalScore >= 70) {
	  grade = "B";
	} else if (finalScore >= 60) {
	  grade = "C";
	} else {
	  grade = "D";
	}


  // ────────────────────────────────────────────────
  // Position size (Step 3) with auto SL pips
  // ────────────────────────────────────────────────
  const acc = typeof accountSize === "number" ? accountSize : NaN;
  const risk =
    typeof riskPercent === "number" ? riskPercent : NaN;

  const pairSettings = PAIR_SETTINGS[pair];

  let effectiveSlPips: number | null = null;
  if (
    typeof stopLossPips === "number" &&
    !isNaN(stopLossPips) &&
    stopLossPips > 0
  ) {
    effectiveSlPips = stopLossPips;
  } else if (indPrice != null && sl != null) {
    const priceDiff = Math.abs(indPrice - sl);
    effectiveSlPips = priceDiff / pairSettings.pipSize;
  }

  const slPips = effectiveSlPips ?? NaN;

  const riskMoney =
    !isNaN(acc) && !isNaN(risk) ? (acc * risk) / 100 : NaN;

  const lotSize =
    !isNaN(riskMoney) &&
    !isNaN(slPips) &&
    slPips > 0 &&
    pairSettings.pipValuePerLot > 0
      ? riskMoney / (slPips * pairSettings.pipValuePerLot)
      : NaN;

  const units = !isNaN(lotSize)
    ? lotSize * pairSettings.contractSize
    : NaN;

  // ────────────────────────────────────────────────
  // Save ICC setup
  // ────────────────────────────────────────────────
	async function handleSave() {
	  // Rule check
	  if (
		finalScore < settings.min_score ||
		(rr != null && rr < settings.min_rr)
	  ) {
		const override = confirm(
		  "This setup is below your ICC/R:R rules. Save it anyway?"
		);
		if (!override) return;
	  }

	  // Extra warning if grade = D
	  if (grade === "D") {
		const override = confirm(
		  "This setup is graded D (avoid). Save it anyway?"
		);
		if (!override) return;
	  }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        alert("Please log in first.");
        return;
      }

      const finalPair =
        customPair.trim().length > 0
          ? customPair.toUpperCase()
          : pair;

      const iccDescription = [
        `SetupType: ${
          setupType === "TREND"
            ? "Trend continuation"
            : "HTF key level rejection"
        }`,
        `HTFKeyLevel: ${usesHTFKeyLevel ? "YES" : "NO"}`,
        `Indication: ${hasIndication ? "YES" : "NO"}`,
        `Correction: ${hasCorrection ? "YES" : "NO"}`,
        `Continuation: ${hasContinuation ? "YES" : "NO"}`,
        `TrendScore: ${trendScore}`,
        `ICCScore: ${iccScore}`,
        `FinalScore: ${finalScore}`,
        `RR: ${
          rr != null && !isNaN(rr) ? rr.toFixed(2) + "R" : "NA"
        }`,
        `Grade: ${grade}`,
      ].join(" | ");

      const { error } = await supabase.from("icc_setups").insert({
        user_id: user.id,
        pair: finalPair,
        direction,
        htf,
        indication_type: iccDescription,
        indication_price: indPrice ?? 0,
        correction_done: hasCorrection,
        liquidity_grab: false,
        ltf,
        ltf_structure_ok: hasContinuation,
        sl_price: sl ?? null,
        entry_price: indPrice ?? null,
        risk_percent: !isNaN(risk) ? risk : null,
      });

      if (error) {
        console.error(error);
        alert("Error saving setup: " + error.message);
      } else {
        alert("ICC setup saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        // optionally redirect to login if you want
      }
    });
  }, []);

  const displayPair =
    customPair.trim().length > 0
      ? customPair.toUpperCase()
      : pair;

  const renderTrendRow = (
    label: string,
    value: TrendState,
    onChange: (val: TrendState) => void,
    tooltip: string
  ) => (
    <div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-text2">{label}</span>
        <span
          className="text-xs text-text3 border border-border rounded-full px-1 cursor-help"
          title={tooltip}
        >
          ?
        </span>
      </div>
      <div className="mt-1 flex gap-2 flex-wrap text-xs">
        <Button
          type="button"
          onClick={() => onChange("BULLISH")}
          className={
            value === "BULLISH"
              ? "bg-green-600 text-white border-green-600"
              : "bg-bg2 text-text1 border-border"
          }
        >
          Bullish
        </Button>
        <Button
          type="button"
          onClick={() => onChange("BEARISH")}
          className={
            value === "BEARISH"
              ? "bg-red-600 text-white border-red-600"
              : "bg-bg2 text-text1 border-border"
          }
        >
          Bearish
        </Button>
        <Button
          type="button"
          onClick={() => onChange("CONSOLIDATING")}
          className={
            value === "CONSOLIDATING"
              ? "bg-yellow-600 text-white border-yellow-600"
              : "bg-bg2 text-text1 border-border"
          }
        >
          Consolidating
        </Button>
      </div>
    </div>
  );

  if (settingsLoading) {
    return (
      <p className="p-4 text-sm text-text2">
        Loading ICC settings…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">ICC Trade Rating</h1>
      <p className="text-text2 text-sm">
        Step 1: Follow the trend. Step 2: Check Indication → Correction →
        Continuation. Step 3: Check R:R and calculate your lot size for
        MetaTrader.
      </p>

      {/* STEP 0 – Pair, direction, setup type, timeframes, prices */}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-text2">Pair</label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value as Pair)}
              className="mt-1 w-full px-3 py-2 rounded-md bg-bg2 border border-border text-text1"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Input
              label="Custom pair (optional)"
              placeholder="e.g. GBPUSD"
              value={customPair}
              onChange={(e) => setCustomPair(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-text2 flex items-center gap-1">
              Direction
              <span
                className="text-xs text-text3 border border-border rounded-full px-1 cursor-help"
                title="Choose the direction you want to trade: LONG = buy, SHORT = sell."
              >
                ?
              </span>
            </label>
            <div className="mt-1 flex gap-2">
              <Button
                type="button"
                onClick={() => setDirection("LONG")}
                className={
                  direction === "LONG"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-bg2 text-text1 border-border"
                }
              >
                Long
              </Button>
              <Button
                type="button"
                onClick={() => setDirection("SHORT")}
                className={
                  direction === "SHORT"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-bg2 text-text1 border-border"
                }
              >
                Short
              </Button>
            </div>

            <label className="text-sm text-text2 mt-4 flex items-center gap-1">
              ICC Setup Type
              <span
                className="text-xs text-text3 border border-border rounded-full px-1 cursor-help"
                title="Trend continuation: you trade in the direction of the main trend after a pullback. HTF key level rejection: price fails to break a strong 4H/Daily/Weekly level and you trade away from that level."
              >
                ?
              </span>
            </label>
            <div className="mt-1 flex gap-2 flex-wrap text-xs">
              <Button
                type="button"
                onClick={() => setSetupType("TREND")}
                className={
                  setupType === "TREND"
                    ? "bg-sky-600/20 text-sky-300 border border-sky-500"
                    : "bg-bg2 text-text2 border border-border"
                }
              >
                Trend continuation
              </Button>
              <Button
                type="button"
                onClick={() => setSetupType("KEY_LEVEL")}
                className={
                  setupType === "KEY_LEVEL"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500"
                    : "bg-bg2 text-text2 border border-border"
                }
              >
                HTF key level rejection
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-text2">Indication HTF</label>
            <select
              value={htf}
              onChange={(e) => setHtf(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md bg-bg2 border border-border text-text1"
            >
              {HTF_OPTIONS.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>

            <label className="text-sm text-text2 mt-3 block">
              Entry LTF
            </label>
            <select
              value={ltf}
              onChange={(e) => setLtf(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md bg-bg2 border border-border text-text1"
            >
              {LTF_OPTIONS.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>

            <Input
              label="Entry price (Indication level)"
              type="number"
              placeholder="e.g. 2500.00"
              value={indicationPrice}
              onChange={(e) =>
                setIndicationPrice(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
            <Input
              label="Stop Loss price"
              type="number"
              placeholder="e.g. 2450.00"
              value={slPrice}
              onChange={(e) =>
                setSlPrice(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
            <Input
              label="Take Profit price"
              type="number"
              placeholder="e.g. 2600.00"
              value={tpPrice}
              onChange={(e) =>
                setTpPrice(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
          </div>
        </div>
      </Card>

      {/* STEP 1 – Trend alignment */}
      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold mb-1">
              Step 1 – Trend Alignment (follow the wave)
            </h2>
            <p className="text-xs text-text2 max-w-xl">
              For each timeframe, decide if price is trending up, trending
              down, or consolidating. Points only count when the trend matches
              your trade direction.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text2">Trend score</p>
            <p className="text-xl font-semibold">{trendScore}%</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mt-4">
          {renderTrendRow(
            "Daily trend",
            dailyTrend,
            setDailyTrend,
            "Are Daily candles making higher highs & higher lows (bullish), lower highs & lower lows (bearish), or just ranging (consolidating)?"
          )}
          {renderTrendRow(
            "4H trend",
            h4Trend,
            setH4Trend,
            "On 4H, is the overall swing structure clearly up, clearly down, or stuck in a sideways box?"
          )}
          {renderTrendRow(
            "1H trend",
            h1Trend,
            setH1Trend,
            "On 1H, is price still flowing in one direction, or is it choppy & sideways?"
          )}
          {renderTrendRow(
            "15m trend",
            m15Trend,
            setM15Trend,
            "Use 15m as your entry context: is it in line with your idea or just consolidating?"
          )}
        </div>
      </Card>

      {/* STEP 2 – ICC core */}
      <Card>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold mb-1">
              Step 2 – ICC Quality (Indication → Correction → Continuation)
            </h2>
            <p className="text-xs text-text2 max-w-xl">
              Simple logic: did the market give you a big clue, did it come
              back to a good zone, and did the lower timeframe confirm the move?
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text2">ICC score</p>
            <p className="text-xl font-semibold">{iccScore}%</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-4 text-sm">
          <div className="flex items-start gap-3">
            <Toggle
              checked={hasIndication}
              onChange={() => setHasIndication((v) => !v)}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Indication</span>
                <span
                  className="text-xs text-text3 border border-border rounded-full px-1 cursor-help"
                  title="Big clue on the higher timeframe: break of structure, liquidity grab + reversal, strong rejection wick at a key level, etc."
                >
                  ?
                </span>
              </div>
              <p className="text-xs text-text2 mt-1">
                Did the market clearly show it wants to move? (Yes = +25%)
              </p>

              <div className="mt-2 flex items-center gap-2">
                <Toggle
                  checked={usesHTFKeyLevel}
                  onChange={() => setUsesHTFKeyLevel((v) => !v)}
                />
                <span className="text-xs text-text2">
                  HTF key level rejection (4H / Daily / Weekly)
                </span>
              </div>
              <p className="text-[11px] text-text3 mt-1">
                Example: price keeps failing to break a strong 4H/Daily/Weekly
                high for shorts, or a strong low for longs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Toggle
              checked={hasCorrection}
              onChange={() => setHasCorrection((v) => !v)}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Correction</span>
                <span
                  className="text-xs text-text3 border border-border rounded-full px-1 cursor-help"
                  title="Price comes back to a fair area to enter: the zone where the move started, an OB, an imbalance, discount/premium, etc."
                >
                  ?
                </span>
              </div>
              <p className="text-xs text-text2 mt-1">
                Has price returned to a good zone, not just anywhere? (Yes =
                +25%)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Toggle
              checked={hasContinuation}
              onChange={() => setHasContinuation((v) => !v)}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">Continuation</span>
                <span
                  className="text-xs text-text3 border border-border rounded-full px-1 cursor-help"
                  title="On 5m/15m/30m, is there a clean trigger in your direction? For example: structure shift, break & retest, engulfing candle."
                >
                  ?
                </span>
              </div>
              <p className="text-xs text-text2 mt-1">
                Did the lower timeframe confirm and give you an entry trigger?
                (Yes = +25%)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Final score + RR + grade + rule check + save */}
      <Card>
        <p className="text-sm mb-1">
          Trade:{" "}
          <span className="font-semibold">
            {displayPair} ({direction})
          </span>{" "}
          on {htf} → entry on {ltf}
        </p>
        <p className="text-xs text-text2 mb-3">
          If ICC score or R:R are weak, you don&apos;t have to fight the
          market – just skip the trade.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-4xl font-bold">{finalScore}%</p>
            <p className={`mt-1 text-sm ${levelColor}`}>{levelLabel}</p>

            <p className="text-sm font-bold mt-2">
              Grade:{" "}
              {grade === "A+" && (
                <span className="text-green-400">A+ (Top Setup)</span>
              )}
              {grade === "A" && (
                <span className="text-green-300">A Setup</span>
              )}
              {grade === "B" && (
                <span className="text-yellow-300">B Setup</span>
              )}
              {grade === "C" && (
                <span className="text-yellow-500">C Setup</span>
              )}
              {grade === "D" && (
                <span className="text-red-400">D — Avoid</span>
              )}
            </p>

            <div className="mt-4 text-xs text-text2 space-y-1">
              <p>
                <span className="font-semibold">Trend score:</span>{" "}
                {trendScore}%
              </p>
              <p>
                <span className="font-semibold">ICC score:</span>{" "}
                {iccScore}% (Ind {indicationScore} / Corr{" "}
                {correctionScore} / Cont {continuationScore})
              </p>
            </div>

            {(finalScore < settings.min_score ||
              (rr != null && rr < settings.min_rr)) && (
              <div className="mt-4 border border-yellow-500/40 bg-yellow-500/5 text-xs text-yellow-400 rounded-md px-3 py-2">
                <p className="font-semibold mb-1">Rule check</p>
                {finalScore < settings.min_score && (
                  <p>
                    • ICC score {finalScore}% is below your minimum of{" "}
                    {settings.min_score}%.
                  </p>
                )}
                {rr != null && rr < settings.min_rr && (
                  <p>
                    • R:R {rr.toFixed(2)}R is below your minimum of{" "}
                    {settings.min_rr}R.
                  </p>
                )}
                <p className="mt-1">
                  This doesn&apos;t mean the trade will lose, it just doesn&apos;t
                  match your plan.
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-1">
              Risk:Reward based on your TP
            </p>
            <p className="text-xs text-text2 mb-2">
              Uses your entry, SL and TP to estimate R:R. You aim for at least{" "}
              {settings.min_rr}R, ideally 3R–4R.
            </p>

            <div className="border border-border rounded-lg px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Risk (price distance)</span>
                <span className="font-semibold">
                  {riskPoints == null || isNaN(riskPoints)
                    ? "—"
                    : riskPoints.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reward (price distance)</span>
                <span className="font-semibold">
                  {rewardPoints == null || isNaN(rewardPoints)
                    ? "—"
                    : rewardPoints.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>R:R</span>
                <span className="font-semibold">
                  {rr == null || isNaN(rr) ? "—" : rr.toFixed(2) + "R"}
                </span>
              </div>
              {rr != null && !isNaN(rr) && (
                <p className={`mt-1 text-xs ${rrColor}`}>{rrLabel}</p>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          className="mt-6"
          loading={saving}
          onClick={handleSave}
        >
          Save ICC Setup
        </Button>
      </Card>

      {/* STEP 3 – Position size */}
      <Card>
        <h3 className="font-semibold text-sm mb-2">
          Step 3 – Position size for MetaTrader
        </h3>
        <p className="text-xs text-text2 mb-3">
          Only use this once you&apos;re happy with the ICC score and R:R.
          This gives you an approximate lot size based on your account, risk
          and stop loss.
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <Input
            label="Account size (USD)"
            type="number"
            placeholder="e.g. 1000"
            value={accountSize}
            onChange={(e) =>
              setAccountSize(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
          <Input
            label="Risk (%)"
            type="number"
            placeholder="e.g. 10"
            value={riskPercent}
            onChange={(e) =>
              setRiskPercent(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
          <div>
            <Input
              label="Stop Loss (pips / points)"
              type="number"
              placeholder="e.g. 100 (leave empty to auto-calc)"
              value={stopLossPips}
              onChange={(e) =>
                setStopLossPips(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
            <p className="mt-1 text-xs text-text3">
              {pairSettings.pipNote} If left empty, SL distance is estimated
              from Entry and SL prices.
            </p>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-bg2 px-4 py-2 font-semibold text-sm">
            Results
          </div>
          <div className="px-4 py-3 text-sm divide-y divide-border">
            <div className="flex justify-between py-1">
              <span>Money at risk (USD)</span>
              <span className="font-semibold">
                {isNaN(riskMoney) ? "—" : riskMoney.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Units (approx)</span>
              <span className="font-semibold">
                {isNaN(units) ? "—" : units.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Position size (lots, approx)</span>
              <span className="font-semibold">
                {isNaN(lotSize) ? "—" : lotSize.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

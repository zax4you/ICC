// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";
import {
  ICCSettings,
  defaultICCSettings,
  fetchICCSettings,
  saveICCSettings,
} from "@/lib/iccSettings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<ICCSettings>(defaultICCSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchICCSettings()
      .then((s) => setSettings(s))
      .finally(() => setLoading(false));
  }, []);

  function handleChange<K extends keyof ICCSettings>(key: K, value: number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveICCSettings(settings);
      alert("Settings saved"); // later: replace with toast
    } catch (e: any) {
      console.error(e);
      alert("Error saving settings: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-text2">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ICC Settings</h1>

      <Card>
        <h2 className="font-semibold text-sm mb-2">Risk & Rules</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <Input
            label="Default risk per trade (%)"
            type="number"
            value={settings.default_risk_percent}
            onChange={(e) =>
              handleChange(
                "default_risk_percent",
                Number(e.target.value || 0)
              )
            }
          />
          <Input
            label="Minimum ICC score to trade (%)"
            type="number"
            value={settings.min_score}
            onChange={(e) =>
              handleChange("min_score", Number(e.target.value || 0))
            }
          />
          <Input
            label="Minimum R:R to trade"
            type="number"
            step="0.1"
            value={settings.min_rr}
            onChange={(e) =>
              handleChange("min_rr", Number(e.target.value || 0))
            }
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-sm mb-2">Trend weights</h2>
        <p className="text-xs text-text2 mb-3">
          These control how much each timeframe contributes to the trend score.
        </p>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <Input
            label="Daily weight"
            type="number"
            value={settings.daily_weight}
            onChange={(e) =>
              handleChange("daily_weight", Number(e.target.value || 0))
            }
          />
          <Input
            label="4H weight"
            type="number"
            value={settings.h4_weight}
            onChange={(e) =>
              handleChange("h4_weight", Number(e.target.value || 0))
            }
          />
          <Input
            label="1H weight"
            type="number"
            value={settings.h1_weight}
            onChange={(e) =>
              handleChange("h1_weight", Number(e.target.value || 0))
            }
          />
          <Input
            label="15m weight"
            type="number"
            value={settings.m15_weight}
            onChange={(e) =>
              handleChange("m15_weight", Number(e.target.value || 0))
            }
          />
        </div>
      </Card>

      <Button onClick={handleSave} loading={saving}>
        Save settings
      </Button>
    </div>
  );
}

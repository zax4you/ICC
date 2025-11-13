"use client";

import Input from "@/components/Input";
import Toggle from "@/components/Toggle";
import Button from "@/components/Button";
import { ICCSetup } from "../page";
import { saveICCSetup } from "./save-action";

export default function ContinuationStep({
  data,
  update,
  back,
}: {
  data: ICCSetup;
  update: (values: Partial<ICCSetup>) => void;
  back: () => void;
}) {
  // Auto entry = indication
  const entry = data.indication_price;
  const sl = data.sl_price;
  const riskPct = data.risk_percent;

  const slDistance = sl ? Math.abs(entry - sl) : 0;

  return (
    <form
      action={async () => {
        await saveICCSetup({ ...data, entry_price: entry });
      }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <span>LTF Structure switched in my direction?</span>
        <Toggle
          checked={data.ltf_structure_ok}
          onChange={() =>
            update({ ltf_structure_ok: !data.ltf_structure_ok })
          }
        />
      </div>

      <Input
        label="LTF (e.g., 5m or 15m)"
        value={data.ltf}
        onChange={(e) => update({ ltf: e.target.value })}
      />

      <Input
        label="SL Price (last HL/LH before break)"
        type="number"
        value={data.sl_price}
        onChange={(e) => update({ sl_price: parseFloat(e.target.value) })}
      />

      <Input
        label="% Risk"
        type="number"
        value={data.risk_percent}
        onChange={(e) => update({ risk_percent: parseFloat(e.target.value) })}
      />

      <div className="p-4 rounded-lg bg-bg2 border border-border">
        <p className="text-text2 text-sm mb-2">Auto Calculations:</p>
        <p>Entry: <strong>{entry}</strong></p>
        <p>SL: <strong>{sl || "—"}</strong></p>
        <p>SL Distance: <strong>{slDistance}</strong></p>
      </div>

      <div className="flex gap-3 mt-6">
        <Button type="button" onClick={back}>
          ← Back
        </Button>

        <Button
          type="submit"
          className="ml-auto"
          disabled={!data.ltf_structure_ok || !data.sl_price}
        >
          Save ICC Setup ✔
        </Button>
      </div>
    </form>
  );
}

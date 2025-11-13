"use client";

import Toggle from "@/components/Toggle";
import Button from "@/components/Button";
import { ICCSetup } from "../page";

export default function CorrectionStep({
  data,
  update,
  next,
  back,
}: {
  data: ICCSetup;
  update: (values: Partial<ICCSetup>) => void;
  next: () => void;
  back: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span>Has price corrected back to Indication?</span>
        <Toggle
          checked={data.correction_done}
          onChange={() => update({ correction_done: !data.correction_done })}
        />
      </div>

      <div className="flex items-center justify-between">
        <span>Liquidity grabbed under/over Indication?</span>
        <Toggle
          checked={data.liquidity_grab}
          onChange={() => update({ liquidity_grab: !data.liquidity_grab })}
        />
      </div>

      <div className="flex gap-3 mt-6">
        <Button onClick={back}>← Back</Button>

        <Button
          className="ml-auto"
          disabled={!data.correction_done || !data.liquidity_grab}
          onClick={next}
        >
          Next: Continuation →
        </Button>
      </div>
    </div>
  );
}

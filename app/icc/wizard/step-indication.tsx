"use client";

import Input from "@/components/Input";
import Button from "@/components/Button";
import { ICCSetup } from "../page";

export default function IndicationStep({
  data,
  update,
  next,
}: {
  data: ICCSetup;
  update: (values: Partial<ICCSetup>) => void;
  next: () => void;
}) {
  return (
    <div className="space-y-5">
      <Input
        label="Pair"
        placeholder="NAS100, XAUUSD..."
        value={data.pair}
        onChange={(e) => update({ pair: e.target.value })}
      />

      <div className="flex gap-4">
        <Button
          className={data.direction === "LONG" ? "border-accent" : ""}
          onClick={() => update({ direction: "LONG" })}
        >
          Long
        </Button>
        <Button
          className={data.direction === "SHORT" ? "border-accent" : ""}
          onClick={() => update({ direction: "SHORT" })}
        >
          Short
        </Button>
      </div>

      <Input
        label="HTF (Indication timeframe)"
        placeholder="4H"
        value={data.htf}
        onChange={(e) => update({ htf: e.target.value })}
      />

      <Input
        label="Indication Type"
        placeholder="BOS, rejection, OB break…"
        value={data.indication_type}
        onChange={(e) => update({ indication_type: e.target.value })}
      />

      <Input
        label="Indication Price / Zone"
        type="number"
        placeholder="Indication level"
        value={data.indication_price}
        onChange={(e) =>
          update({ indication_price: parseFloat(e.target.value) })
        }
      />

      <Button
        className="w-full mt-4"
        onClick={next}
        disabled={!data.pair || !data.indication_type || !data.indication_price}
      >
        Next: Correction →
      </Button>
    </div>
  );
}

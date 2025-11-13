"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Table from "@/components/Table";
import { saveConfluence } from "./save-action";

interface TFBlock {
  label: string;
  fields: {
    name: string;
    weight: number;
    checked: boolean;
  }[];
}

export default function ConfluencePage() {
  const [blocks, setBlocks] = useState<TFBlock[]>([
    {
      label: "WEEKLY",
      fields: [
        { name: "Trend", weight: 10, checked: false },
        { name: "At AOI / Rejected", weight: 10, checked: false },
        { name: "Touching EMA", weight: 5, checked: false },
        { name: "Round Psychological Level", weight: 5, checked: false },
        { name: "Rejection from Previous Structure", weight: 10, checked: false },
        { name: "Break & Retest / H&S Pattern", weight: 10, checked: false },
      ],
    },
    {
      label: "DAILY",
      fields: [
        { name: "Trend", weight: 10, checked: false },
        { name: "At AOI / Rejected", weight: 10, checked: false },
        { name: "Touching EMA", weight: 5, checked: false },
        { name: "Round Psychological Level", weight: 10, checked: false },
        { name: "Rejection from Previous Structure", weight: 10, checked: false },
        { name: "Candlestick Rejection from AOI", weight: 10, checked: false },
        { name: "Break & Retest / H&S Pattern", weight: 10, checked: false },
      ],
    },
    {
      label: "4H",
      fields: [
        { name: "Trend", weight: 5, checked: false },
        { name: "At AOI / Rejected", weight: 10, checked: false },
        { name: "Touching EMA", weight: 5, checked: false },
        { name: "Round Psychological Level", weight: 10, checked: false },
        { name: "Rejection from Previous Structure", weight: 10, checked: false },
        { name: "Candlestick Rejection from AOI", weight: 5, checked: false },
        { name: "Break & Retest / H&S Pattern", weight: 10, checked: false },
      ],
    },
    {
      label: "2H, 1H, 30m",
      fields: [
        { name: "Trend", weight: 5, checked: false },
        { name: "At AOI / Rejected", weight: 5, checked: false },
        { name: "Touching EMA", weight: 5, checked: false },
        { name: "Round Psychological Level", weight: 10, checked: false },
        { name: "Rejection from Previous Structure", weight: 10, checked: false },
        { name: "Break & Retest / H&S Pattern", weight: 10, checked: false },
      ],
    },
    {
      label: "LOWER TF",
      fields: [
        { name: "Shift of structure", weight: 10, checked: false },
        { name: "Engulfing candlestick (5m/15m/30m)", weight: 10, checked: false },
      ],
    },
  ]);

  const toggle = (blockIndex: number, fieldIndex: number) => {
    setBlocks((prev) =>
      prev.map((block, i) =>
        i === blockIndex
          ? {
              ...block,
              fields: block.fields.map((f, j) =>
                j === fieldIndex ? { ...f, checked: !f.checked } : f
              ),
            }
          : block
      )
    );
  };

  const calcPercent = (block: TFBlock) =>
    block.fields
      .filter((f) => f.checked)
      .reduce((acc, f) => acc + f.weight, 0);

  const percents = blocks.map((b) => calcPercent(b));
  const total = percents.reduce((a, b) => a + b, 0);

  const level =
    total < 30
      ? "Low Confluence"
      : total < 60
      ? "Medium Confluence"
      : "High Confluence";

  const tableHeaders = ["Timeframe", "Confluence %"];
  const tableRows = blocks.map((b, i) => [
    b.label,
    percents[i] + "%",
  ]);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-5">Confluence Checklist</h1>

      <div className="grid grid-cols-1 gap-6">
        {blocks.map((block, i) => (
          <Card key={block.label}>
            <h2 className="text-xl font-semibold mb-3">{block.label}</h2>

            <div className="grid grid-cols-1 gap-3">
              {block.fields.map((f, j) => (
                <label
                  key={j}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{f.name} (+{f.weight}%)</span>

                  <input
                    type="checkbox"
                    checked={f.checked}
                    onChange={() => toggle(i, j)}
                    className="h-5 w-5 bg-bg2 border border-border rounded"
                  />
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Confluence Summary</h2>

        <Table headers={tableHeaders} rows={tableRows} />

        <div className="mt-5 p-4 rounded-lg bg-bg2 border border-border">
          <p className="text-text2 text-sm mb-2">Total Confluence</p>
          <p className="text-2xl font-bold">{total}%</p>

          <p
            className={`mt-2 font-semibold ${
              level === "High Confluence"
                ? "text-accent"
                : level === "Medium Confluence"
                ? "text-yellow-400"
                : "text-red-500"
            }`}
          >
            {level}
          </p>
        </div>

        <form
          action={async () => {
            await saveConfluence({
              weekly: percents[0],
              daily: percents[1],
              h4: percents[2],
              h2_1h_30m: percents[3],
              lower_tf: percents[4],
              total,
            });
          }}
        >
          <Button className="mt-6" type="submit">
            Save Confluence to History
          </Button>
        </form>
      </Card>
    </div>
  );
}

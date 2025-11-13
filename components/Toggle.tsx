"use client";

import clsx from "clsx";

export default function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={clsx(
        "h-6 w-11 rounded-full flex items-center px-1 transition",
        checked
          ? "bg-accent"
          : "bg-border"
      )}
    >
      <div
        className={clsx(
          "h-4 w-4 bg-white rounded-full transition",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

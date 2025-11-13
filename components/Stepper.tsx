import clsx from "clsx";

export default function Stepper({
  steps,
  active,
}: {
  steps: string[];
  active: number;
}) {
  return (
    <div className="flex items-center gap-6 mb-6">
      {steps.map((label, i) => {
        const stepIndex = i + 1;
        const isActive = active === stepIndex;
        const isDone = active > stepIndex;

        return (
          <div
            key={label}
            className="flex items-center gap-2"
          >
            <div
              className={clsx(
                "h-7 w-7 rounded-full flex items-center justify-center border text-sm",
                isActive
                  ? "border-accent text-accent"
                  : isDone
                  ? "border-accent bg-accent text-bg"
                  : "border-border text-text2"
              )}
            >
              {stepIndex}
            </div>

            <span
              className={clsx(
                "text-sm",
                isActive
                  ? "text-accent"
                  : isDone
                  ? "text-accent"
                  : "text-text2"
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

import { ReactNode } from "react";
import clsx from "clsx";

export default function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "bg-card border border-border rounded-xl p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

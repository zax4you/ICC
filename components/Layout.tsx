import { ReactNode } from "react";

export default function PageLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}

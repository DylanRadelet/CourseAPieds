import type { ReactNode } from "react";

export function NeoCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`neo p-6 ${className}`}>{children}</div>;
}

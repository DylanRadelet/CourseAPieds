import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="neo p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-cap-muted">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-3xl font-extrabold text-cap-black">{value}</span>
    </div>
  );
}

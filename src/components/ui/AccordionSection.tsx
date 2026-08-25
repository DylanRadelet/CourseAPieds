"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function AccordionSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="neo">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cap-black">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.25}
          className={`text-cap-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? <div className="px-5 pb-5 space-y-4">{children}</div> : null}
    </div>
  );
}

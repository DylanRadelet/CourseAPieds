"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function AccordionSection({
  title,
  icon,
  defaultOpen = false,
  mobileOnly = false,
  children,
}: {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  /** Collapsible only below the sm breakpoint — always expanded, header
   * non-interactive, from sm upward. */
  mobileOnly?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="neo">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left ${
          mobileOnly ? "cursor-pointer sm:cursor-default" : "cursor-pointer"
        }`}
        aria-expanded={mobileOnly ? undefined : open}
      >
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cap-black">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.25}
          className={`text-cap-muted transition-transform shrink-0 ${open ? "rotate-180" : ""} ${
            mobileOnly ? "sm:hidden" : ""
          }`}
        />
      </button>

      <div
        className={`px-5 pb-5 space-y-4 ${open ? "block" : "hidden"} ${
          mobileOnly ? "sm:block" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

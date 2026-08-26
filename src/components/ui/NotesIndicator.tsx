"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import { NotesViewerModal } from "@/components/NotesViewerModal";

export function NotesIndicator({
  date,
  title,
  notes,
  className,
}: {
  date: Date;
  title?: string | null;
  notes: string | null | undefined;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!notes) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={className ?? "text-cap-violet hover:text-cap-black"}
        aria-label="Voir les notes"
      >
        <StickyNote size={13} strokeWidth={2.25} />
      </button>
      {open ? (
        <NotesViewerModal
          date={date}
          title={title ?? null}
          notes={notes}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

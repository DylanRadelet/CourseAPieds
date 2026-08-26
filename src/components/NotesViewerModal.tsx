"use client";

import { X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function NotesViewerModal({
  date,
  title,
  notes,
  onClose,
}: {
  date: Date;
  title: string | null;
  notes: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="neo-modal p-6 w-full max-w-md max-h-[80vh] flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-cap-black capitalize">
              {format(date, "EEEE d MMMM", { locale: fr })}
            </h2>
            {title ? <p className="text-sm text-cap-violet font-semibold">{title}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted shrink-0"
            aria-label="Fermer"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        <div className="neo-inset p-4 overflow-y-auto neo-scrollbar">
          <p className="text-sm text-cap-black whitespace-pre-wrap leading-relaxed">
            {notes}
          </p>
        </div>
      </div>
    </div>
  );
}

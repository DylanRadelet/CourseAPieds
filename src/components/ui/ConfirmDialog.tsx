"use client";

import { AlertTriangle, X } from "lucide-react";
import { NeoButton } from "./NeoButton";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div
        className="neo-modal p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div
            className={`flex items-center gap-1.5 text-lg font-bold ${
              danger ? "text-red-600" : "text-cap-black"
            }`}
          >
            {danger ? <AlertTriangle size={18} strokeWidth={2.25} /> : null}
            {title}
          </div>
          <button
            onClick={onCancel}
            className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted shrink-0"
            aria-label="Fermer"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {description ? <p className="text-sm text-cap-muted">{description}</p> : null}

        <div className="flex gap-3 pt-1">
          <NeoButton type="button" onClick={onCancel} disabled={loading} className="flex-1">
            {cancelLabel}
          </NeoButton>
          <NeoButton
            type="button"
            variant={danger ? "danger" : "violet"}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "..." : confirmLabel}
          </NeoButton>
        </div>
      </div>
    </div>
  );
}

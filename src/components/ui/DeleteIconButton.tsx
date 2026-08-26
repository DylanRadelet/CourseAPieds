"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

export function DeleteIconButton({
  confirmTitle,
  confirmDescription,
  onConfirm,
}: {
  confirmTitle: string;
  confirmDescription: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setConfirming(false);
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted hover:text-red-600"
        title="Supprimer"
        aria-label={confirmTitle}
      >
        <Trash2 size={14} strokeWidth={2.25} />
      </button>

      {confirming ? (
        <ConfirmDialog
          title={confirmTitle}
          description={confirmDescription}
          confirmLabel="Supprimer"
          danger
          loading={loading}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}

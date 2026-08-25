"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DeleteRaceButton({ raceId, raceName }: { raceId: string; raceName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/races/${raceId}`, { method: "DELETE" });
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted hover:text-red-600"
        title="Supprimer"
        aria-label="Supprimer la course"
      >
        <Trash2 size={14} strokeWidth={2.25} />
      </button>

      {confirming ? (
        <ConfirmDialog
          title="Supprimer la course"
          description={`"${raceName}" et tous ses entraînements seront définitivement supprimés.`}
          confirmLabel="Supprimer"
          danger
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}

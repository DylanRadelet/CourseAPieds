"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import { normalizeDistanceLabel } from "@/lib/format";
import type { Race } from "@/lib/types";

export function EditRaceModal({
  race,
  onClose,
  onSaved,
}: {
  race: Race;
  onClose: () => void;
  onSaved: (race: Race) => void;
}) {
  const [name, setName] = useState(race.name);
  const [raceDate, setRaceDate] = useState(race.race_date);
  const [distanceLabel, setDistanceLabel] = useState(race.distance_label ?? "");
  const [elevationGain, setElevationGain] = useState(
    race.elevation_gain_m != null ? String(race.elevation_gain_m) : ""
  );
  const [notes, setNotes] = useState(race.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        race_date: raceDate,
        distance_label: distanceLabel ? normalizeDistanceLabel(distanceLabel) : null,
        elevation_gain_m: elevationGain ? Number(elevationGain) : null,
        notes: notes || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'enregistrer.");
      return;
    }

    const data: { race: Race } = await res.json();
    onSaved(data.race);
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="neo-modal p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-cap-black">Modifier la course</h2>
          <button
            onClick={onClose}
            className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted"
            aria-label="Fermer"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Nom</label>
          <NeoInput value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Date</label>
          <NeoInput
            type="date"
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">Distance (km)</label>
            <NeoInput
              placeholder="10, semi, marathon..."
              value={distanceLabel}
              onChange={(e) => setDistanceLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">D+ (m)</label>
            <NeoInput
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={elevationGain}
              onChange={(e) => setElevationGain(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">
            Infos importantes
          </label>
          <NeoTextarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeoButton
          type="button"
          variant="violet"
          onClick={save}
          disabled={loading || !name || !raceDate}
          className="w-full"
        >
          <Save size={15} strokeWidth={2.25} />
          {loading ? "Enregistrement..." : "Enregistrer"}
        </NeoButton>
      </div>
    </div>
  );
}

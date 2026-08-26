"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import { normalizeDistanceLabel } from "@/lib/format";

export function RaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [distanceLabel, setDistanceLabel] = useState("");
  const [elevationGain, setElevationGain] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/races", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        race_date: raceDate,
        distance_label: distanceLabel ? normalizeDistanceLabel(distanceLabel) : undefined,
        elevation_gain_m: elevationGain ? Number(elevationGain) : undefined,
        notes: notes || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible de créer la course.");
      return;
    }

    setName("");
    setRaceDate("");
    setDistanceLabel("");
    setElevationGain("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cap-muted">Nom</label>
        <NeoInput
          placeholder="Marathon de Paris"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          <label className="text-xs font-medium text-cap-muted">
            Distance (km)
          </label>
          <NeoInput
            placeholder="10, semi, marathon..."
            value={distanceLabel}
            onChange={(e) => setDistanceLabel(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">
            D+ (m)
          </label>
          <NeoInput
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="800"
            value={elevationGain}
            onChange={(e) => setElevationGain(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cap-muted">
          Infos importantes
        </label>
        <NeoTextarea
          rows={3}
          placeholder="Lieu, objectif de temps, dossard, lien d'inscription..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <NeoButton
        type="submit"
        variant="violet"
        disabled={loading || !name || !raceDate}
        className="w-full"
      >
        <Plus size={16} strokeWidth={2.5} />
        {loading ? "Ajout..." : "Ajouter la course"}
      </NeoButton>
    </form>
  );
}

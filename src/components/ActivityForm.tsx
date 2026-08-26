"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import { parseDurationToMinutes } from "@/lib/pace";

export function ActivityForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [durationText, setDurationText] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [elevation, setElevation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const durationMin = durationText ? parseDurationToMinutes(durationText) : null;
    if (durationText && durationMin === null) {
      setLoading(false);
      setError("Temps invalide — utilise le format MM:SS ou H:MM:SS.");
      return;
    }

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_date: date,
        title: title || undefined,
        distance_km: distanceKm ? Number(distanceKm) : undefined,
        duration_min: durationMin ?? undefined,
        avg_heart_rate: heartRate ? Number(heartRate) : undefined,
        elevation_gain_m: elevation ? Number(elevation) : undefined,
        notes: notes || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'enregistrer.");
      return;
    }

    setDate("");
    setTitle("");
    setDistanceKm("");
    setDurationText("");
    setHeartRate("");
    setElevation("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="neo p-6 space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-cap-black">
        Ajouter une course passée
      </h2>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cap-muted">Date</label>
        <NeoInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cap-muted">Titre (optionnel)</label>
        <NeoInput
          placeholder="Sortie du dimanche, 10km de Namur..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Distance (km)</label>
          <NeoInput
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="8"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Temps total</label>
          <NeoInput
            placeholder="42:30"
            value={durationText}
            onChange={(e) => setDurationText(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">FC moyenne (bpm)</label>
          <NeoInput
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="152"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">D+ (m)</label>
          <NeoInput
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="120"
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-cap-muted">Notes</label>
        <NeoTextarea
          rows={3}
          placeholder="Sensations, conditions, contexte..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <NeoButton
        type="submit"
        variant="violet"
        disabled={loading || !date}
        className="w-full"
      >
        <Plus size={16} strokeWidth={2.5} />
        {loading ? "Ajout..." : "Ajouter"}
      </NeoButton>
    </form>
  );
}

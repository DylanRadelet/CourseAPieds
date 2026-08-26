"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import { formatMinutesToDuration, parseDurationToMinutes } from "@/lib/pace";
import type { Activity } from "@/lib/types";

export function EditActivityModal({
  activity,
  onClose,
  onSaved,
}: {
  activity: Activity;
  onClose: () => void;
  onSaved: (activity: Activity) => void;
}) {
  const [date, setDate] = useState(activity.activity_date);
  const [title, setTitle] = useState(activity.title ?? "");
  const [distanceKm, setDistanceKm] = useState(
    activity.distance_km != null ? String(activity.distance_km) : ""
  );
  const [durationText, setDurationText] = useState(
    activity.duration_min != null ? formatMinutesToDuration(activity.duration_min) : ""
  );
  const [heartRate, setHeartRate] = useState(
    activity.avg_heart_rate != null ? String(activity.avg_heart_rate) : ""
  );
  const [elevation, setElevation] = useState(
    activity.elevation_gain_m != null ? String(activity.elevation_gain_m) : ""
  );
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);

    const durationMin = durationText ? parseDurationToMinutes(durationText) : null;
    if (durationText && durationMin === null) {
      setLoading(false);
      setError("Temps invalide — utilise le format MM:SS ou H:MM:SS.");
      return;
    }

    const res = await fetch(`/api/activities/${activity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_date: date,
        title: title || null,
        distance_km: distanceKm ? Number(distanceKm) : null,
        duration_min: durationMin,
        avg_heart_rate: heartRate ? Number(heartRate) : null,
        elevation_gain_m: elevation ? Number(elevation) : null,
        notes: notes || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'enregistrer.");
      return;
    }

    const data: { activity: Activity } = await res.json();
    onSaved(data.activity);
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
          <label className="text-xs font-medium text-cap-muted">Date</label>
          <NeoInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Titre</label>
          <NeoInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">Distance (km)</label>
            <NeoInput
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
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
              value={elevation}
              onChange={(e) => setElevation(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Notes</label>
          <NeoTextarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeoButton
          type="button"
          variant="violet"
          onClick={save}
          disabled={loading || !date}
          className="w-full"
        >
          <Save size={15} strokeWidth={2.25} />
          {loading ? "Enregistrement..." : "Enregistrer"}
        </NeoButton>
      </div>
    </div>
  );
}

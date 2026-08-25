"use client";

import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import type { Workout } from "@/lib/types";
import { toDateKey } from "@/lib/weeks";

export function WorkoutModal({
  date,
  raceId,
  workout,
  onClose,
  onSaved,
}: {
  date: Date;
  raceId: string;
  workout: Workout | undefined;
  onClose: () => void;
  onSaved: (workout: Workout | null, dateKey: string) => void;
}) {
  const [title, setTitle] = useState(workout?.title ?? "");
  const [distanceKm, setDistanceKm] = useState(
    workout?.distance_km != null ? String(workout.distance_km) : ""
  );
  const [durationMin, setDurationMin] = useState(
    workout?.duration_min != null ? String(workout.duration_min) : ""
  );
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [done, setDone] = useState(workout?.done ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateKey = toDateKey(date);

  async function save() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_id: raceId,
        workout_date: dateKey,
        title: title || undefined,
        notes: notes || undefined,
        distance_km: distanceKm ? Number(distanceKm) : undefined,
        duration_min: durationMin ? Number(durationMin) : undefined,
        done,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'enregistrer.");
      return;
    }

    const data = await res.json();
    onSaved(data.workout, dateKey);
  }

  async function clear() {
    setTitle("");
    setDistanceKm("");
    setDurationMin("");
    setNotes("");
    setDone(false);
    setLoading(true);
    setError(null);

    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_id: raceId,
        workout_date: dateKey,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Impossible de supprimer.");
      return;
    }

    onSaved(null, dateKey);
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
          <div>
            <h2 className="text-lg font-bold text-cap-black capitalize">
              {format(date, "EEEE d MMMM", { locale: fr })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted"
            aria-label="Fermer"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Séance</label>
          <NeoInput
            placeholder="Footing, fractionné, sortie longue..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">
              Distance (km)
            </label>
            <NeoInput
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">
              Durée (min)
            </label>
            <NeoInput
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Notes</label>
          <NeoTextarea
            rows={3}
            placeholder="Sensations, allure, météo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setDone((d) => !d)}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
            done
              ? "bg-cap-lime text-cap-black"
              : "neo-inset text-cap-muted"
          }`}
        >
          <Check size={16} strokeWidth={2.5} />
          {done ? "Séance faite" : "Marquer comme faite"}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3 pt-1">
          <NeoButton
            type="button"
            onClick={clear}
            disabled={loading}
            className="text-cap-muted"
          >
            <Trash2 size={15} strokeWidth={2.25} />
          </NeoButton>
          <NeoButton
            type="button"
            variant="violet"
            onClick={save}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </NeoButton>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowLeft, Check, Flame, Heart, Mountain, Trash2, Timer, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import type { Workout } from "@/lib/types";
import { toDateKey } from "@/lib/weeks";
import { computePace, formatMinutesToDuration, parseDurationToMinutes } from "@/lib/pace";

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

  const [actualDistanceKm, setActualDistanceKm] = useState(
    workout?.actual_distance_km != null ? String(workout.actual_distance_km) : ""
  );
  const [actualDurationText, setActualDurationText] = useState(
    workout?.actual_duration_min != null
      ? formatMinutesToDuration(workout.actual_duration_min)
      : ""
  );
  const [actualHeartRate, setActualHeartRate] = useState(
    workout?.actual_avg_heart_rate != null ? String(workout.actual_avg_heart_rate) : ""
  );
  const [actualElevation, setActualElevation] = useState(
    workout?.actual_elevation_gain_m != null ? String(workout.actual_elevation_gain_m) : ""
  );
  const [actualNotes, setActualNotes] = useState(workout?.actual_notes ?? "");

  const [flipped, setFlipped] = useState(workout?.done ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateKey = toDateKey(date);
  const parsedActualDuration = parseDurationToMinutes(actualDurationText);
  const pace = computePace(
    actualDistanceKm ? Number(actualDistanceKm) : null,
    parsedActualDuration
  );

  async function persist(nextDone: boolean) {
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
        done: nextDone,
        actual_distance_km: actualDistanceKm ? Number(actualDistanceKm) : undefined,
        actual_duration_min: parsedActualDuration ?? undefined,
        actual_avg_heart_rate: actualHeartRate ? Number(actualHeartRate) : undefined,
        actual_elevation_gain_m: actualElevation ? Number(actualElevation) : undefined,
        actual_notes: actualNotes || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'enregistrer.");
      return false;
    }

    const data = await res.json();
    setDone(nextDone);
    onSaved(data.workout, dateKey);
    return true;
  }

  async function savePlan() {
    await persist(done);
  }

  async function markDone() {
    setFlipped(true);
  }

  async function saveResult() {
    await persist(true);
  }

  async function unmarkDone() {
    const ok = await persist(false);
    if (ok) setFlipped(false);
  }

  async function clear() {
    setTitle("");
    setDistanceKm("");
    setDurationMin("");
    setNotes("");
    setDone(false);
    setActualDistanceKm("");
    setActualDurationText("");
    setActualHeartRate("");
    setActualElevation("");
    setActualNotes("");
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
        className="w-full max-w-sm [perspective:1200px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "none" }}
        >
          {/* FRONT — the plan */}
          <div className="neo-modal p-6 space-y-4 [backface-visibility:hidden]">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-cap-black capitalize">
                {format(date, "EEEE d MMMM", { locale: fr })}
              </h2>
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
                rows={4}
                placeholder="Sensations, allure, météo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={done ? () => setFlipped(true) : markDone}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                done ? "bg-cap-lime text-cap-black" : "neo-inset text-cap-muted"
              }`}
            >
              <Check size={16} strokeWidth={2.5} />
              {done ? "Séance faite — voir mes résultats" : "Marquer comme faite"}
            </button>

            {error && !flipped ? <p className="text-sm text-red-600">{error}</p> : null}

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
                onClick={savePlan}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </NeoButton>
            </div>
          </div>

          {/* BACK — the logged result */}
          <div
            className="neo-modal p-6 space-y-4 absolute inset-0 [backface-visibility:hidden] overflow-y-auto"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setFlipped(false)}
                  className="flex items-center gap-1 text-xs text-cap-muted hover:text-cap-black mb-1"
                >
                  <ArrowLeft size={12} strokeWidth={2.5} />
                  Retour au plan
                </button>
                <h2 className="text-lg font-bold text-cap-black capitalize">
                  Ta course réelle
                </h2>
              </div>
              <button
                onClick={onClose}
                className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted shrink-0"
                aria-label="Fermer"
              >
                <X size={15} strokeWidth={2.25} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-cap-muted">
                  Distance réalisée (km)
                </label>
                <NeoInput
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="8"
                  value={actualDistanceKm}
                  onChange={(e) => setActualDistanceKm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-cap-muted">
                  Temps total
                </label>
                <NeoInput
                  placeholder="40:00"
                  value={actualDurationText}
                  onChange={(e) => setActualDurationText(e.target.value)}
                />
              </div>
            </div>

            {pace ? (
              <div className="neo-sm px-3 py-2 flex items-center gap-1.5 text-xs font-semibold text-cap-violet w-fit">
                <Timer size={13} strokeWidth={2.5} />
                Allure moyenne : {pace}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-cap-muted flex items-center gap-1">
                  <Heart size={11} strokeWidth={2.5} />
                  FC moyenne (bpm)
                </label>
                <NeoInput
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="152"
                  value={actualHeartRate}
                  onChange={(e) => setActualHeartRate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-cap-muted flex items-center gap-1">
                  <Mountain size={11} strokeWidth={2.5} />
                  D+ (m)
                </label>
                <NeoInput
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  placeholder="120"
                  value={actualElevation}
                  onChange={(e) => setActualElevation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-cap-muted">
                Ressenti / notes
              </label>
              <NeoTextarea
                rows={4}
                placeholder="Sensations, météo, ce qui a marché ou non..."
                value={actualNotes}
                onChange={(e) => setActualNotes(e.target.value)}
              />
            </div>

            {error && flipped ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-3 pt-1">
              {done ? (
                <NeoButton
                  type="button"
                  onClick={unmarkDone}
                  disabled={loading}
                  className="text-cap-muted"
                  title="Marquer comme non faite"
                >
                  <Flame size={15} strokeWidth={2.25} />
                </NeoButton>
              ) : null}
              <NeoButton
                type="button"
                variant="lime"
                onClick={saveResult}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Enregistrement..." : "Enregistrer ma course"}
              </NeoButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

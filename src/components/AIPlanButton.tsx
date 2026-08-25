"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NeoButton } from "@/components/ui/NeoButton";
import type { Workout } from "@/lib/types";
import type { ProposedSession } from "@/lib/ai/trainingPlan";

export function AIPlanButton({
  raceId,
  onApplied,
}: {
  raceId: string;
  onApplied: (workouts: Workout[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProposedSession[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  async function generate() {
    setOpen(true);
    setLoading(true);
    setError(null);
    setSummary(null);
    setSessions([]);

    const res = await fetch(`/api/races/${raceId}/plan`, { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible de générer un plan.");
      return;
    }

    const data: { summary: string; sessions: ProposedSession[] } = await res.json();
    setSummary(data.summary);
    setSessions(data.sessions);
    setSelected(new Set(data.sessions.map((s) => s.date)));
  }

  function toggle(date: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  async function apply() {
    const toApply = sessions.filter((s) => selected.has(s.date));
    if (toApply.length === 0) return;

    setApplying(true);
    setError(null);

    const res = await fetch("/api/workouts/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_id: raceId,
        sessions: toApply.map((s) => ({
          date: s.date,
          title: s.title || undefined,
          distance_km: s.distance_km ?? undefined,
          duration_min: s.duration_min ?? undefined,
          notes: s.notes ?? undefined,
        })),
      }),
    });

    setApplying(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'appliquer le plan.");
      return;
    }

    const data: { workouts: Workout[] } = await res.json();
    onApplied(data.workouts);
    setOpen(false);
  }

  return (
    <>
      <NeoButton type="button" variant="lime" onClick={generate}>
        <Sparkles size={15} strokeWidth={2.25} />
        Générer avec l&apos;IA
      </NeoButton>

      {open ? (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => !applying && setOpen(false)}
        >
          <div
            className="neo-modal p-6 w-full max-w-lg max-h-[85vh] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-lg font-bold text-cap-black">
                <Sparkles size={18} strokeWidth={2.25} className="text-cap-violet" />
                Plan proposé par l&apos;IA
              </div>
              <button
                onClick={() => setOpen(false)}
                className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted"
                aria-label="Fermer"
              >
                <X size={15} strokeWidth={2.25} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-2">
                <Loader2 size={18} strokeWidth={2.25} className="text-cap-violet animate-spin shrink-0" />
                <p className="text-sm text-cap-muted">
                  Le coach IA construit le plan (jusqu&apos;à une minute)...
                </p>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {summary ? (
              <p className="text-sm text-cap-black bg-cap-violet-soft rounded-2xl p-3 shrink-0">
                {summary}
              </p>
            ) : null}

            {sessions.length > 0 ? (
              <div className="overflow-y-auto neo-scrollbar flex flex-col gap-2 pr-1">
                {sessions.map((session) => {
                  const date = new Date(`${session.date}T00:00:00`);
                  const checked = selected.has(session.date);
                  return (
                    <label
                      key={session.date}
                      className={`neo-inset flex items-start gap-3 p-3 cursor-pointer ${
                        checked ? "" : "opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(session.date)}
                        className="mt-1 accent-[var(--cap-violet)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-cap-muted capitalize shrink-0">
                            {format(date, "EEE d MMM", { locale: fr })}
                          </span>
                          {session.distance_km || session.duration_min ? (
                            <span className="text-[11px] font-semibold text-cap-violet shrink-0">
                              {session.distance_km ? `${session.distance_km} km` : ""}
                              {session.distance_km && session.duration_min ? " · " : ""}
                              {session.duration_min ? `${session.duration_min} min` : ""}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium text-cap-black">{session.title}</p>
                        {session.notes ? (
                          <p className="text-xs text-cap-muted mt-0.5">{session.notes}</p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : null}

            {!loading && summary && sessions.length === 0 ? (
              <p className="text-sm text-cap-muted">
                Rien à proposer — toutes les cases de ce bloc sont déjà remplies.
              </p>
            ) : null}

            {sessions.length > 0 ? (
              <NeoButton
                type="button"
                variant="violet"
                onClick={apply}
                disabled={applying || selected.size === 0}
                className="w-full shrink-0"
              >
                {applying
                  ? "Application..."
                  : `Appliquer ${selected.size} séance${selected.size > 1 ? "s" : ""}`}
              </NeoButton>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

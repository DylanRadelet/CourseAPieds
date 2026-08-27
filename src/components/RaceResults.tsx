"use client";

import { useState } from "react";
import { Loader2, Medal, RefreshCw, Sparkles, Star, Trophy, X } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput, NeoTextarea } from "@/components/ui/NeoInput";
import type { Race } from "@/lib/types";

type ResultFields = Pick<
  Race,
  "result_time" | "result_rank" | "result_feeling" | "result_notes"
>;

function hasAnyResult(race: ResultFields) {
  return Boolean(
    race.result_time || race.result_rank || race.result_feeling || race.result_notes
  );
}

export function RaceResults({ raceId, race }: { raceId: string; race: Race }) {
  const [current, setCurrent] = useState<ResultFields>({
    result_time: race.result_time,
    result_rank: race.result_rank,
    result_feeling: race.result_feeling,
    result_notes: race.result_notes,
  });
  const [open, setOpen] = useState(() => !hasAnyResult(current));
  const [aiReport, setAiReport] = useState(race.ai_report);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  async function generateReport() {
    setGeneratingReport(true);
    setReportError(null);

    const res = await fetch(`/api/races/${raceId}/report`, { method: "POST" });

    setGeneratingReport(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setReportError(data?.error ?? "Impossible de générer le rapport.");
      return;
    }

    const data: { report: string } = await res.json();
    setAiReport(data.report);
  }

  return (
    <div className="space-y-3">
      {hasAnyResult(current) ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="neo-inset w-full text-left p-4 flex flex-col gap-2 hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-cap-violet uppercase tracking-wide">
            <Trophy size={13} strokeWidth={2.5} />
            Vos résultats
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-cap-black">
            {current.result_time ? <span>Temps: {current.result_time}</span> : null}
            {current.result_rank ? <span>Classement: {current.result_rank}</span> : null}
            {current.result_feeling ? (
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={13}
                    strokeWidth={2}
                    className={
                      i < (current.result_feeling ?? 0)
                        ? "fill-cap-lime text-cap-lime"
                        : "text-cap-muted"
                    }
                  />
                ))}
              </span>
            ) : null}
          </div>
          {current.result_notes ? (
            <p className="text-xs text-cap-muted whitespace-pre-wrap">
              {current.result_notes}
            </p>
          ) : null}
        </button>
      ) : (
        <NeoButton type="button" onClick={() => setOpen(true)} className="w-full">
          <Medal size={15} strokeWidth={2.25} />
          Ajouter mes résultats
        </NeoButton>
      )}

      {current.result_time ? (
        <div className="neo-inset p-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cap-violet uppercase tracking-wide">
              <Sparkles size={13} strokeWidth={2.5} />
              Rapport IA
            </div>
            {aiReport && !generatingReport ? (
              <button
                type="button"
                onClick={generateReport}
                className="text-cap-muted hover:text-cap-black"
                title="Régénérer le rapport"
                aria-label="Régénérer le rapport"
              >
                <RefreshCw size={13} strokeWidth={2.25} />
              </button>
            ) : null}
          </div>

          {generatingReport ? (
            <div className="flex items-center gap-2 text-sm text-cap-muted">
              <Loader2 size={14} strokeWidth={2.25} className="animate-spin" />
              Génération du rapport...
            </div>
          ) : aiReport ? (
            <p className="text-sm text-cap-black whitespace-pre-wrap">{aiReport}</p>
          ) : (
            <NeoButton type="button" onClick={generateReport} className="w-full">
              <Sparkles size={15} strokeWidth={2.25} />
              Générer le rapport
            </NeoButton>
          )}

          {reportError ? <p className="text-sm text-red-600 mt-2">{reportError}</p> : null}
        </div>
      ) : null}

      {open ? (
        <ResultModal
          raceId={raceId}
          initial={current}
          onClose={() => setOpen(false)}
          onSaved={(updated) => {
            setCurrent(updated);
            setOpen(false);
            if (updated.result_time) {
              setAiReport(null);
              generateReport();
            }
          }}
        />
      ) : null}
    </div>
  );
}

function ResultModal({
  raceId,
  initial,
  onClose,
  onSaved,
}: {
  raceId: string;
  initial: ResultFields;
  onClose: () => void;
  onSaved: (result: ResultFields) => void;
}) {
  const [time, setTime] = useState(initial.result_time ?? "");
  const [rank, setRank] = useState(initial.result_rank ?? "");
  const [feeling, setFeeling] = useState(initial.result_feeling ?? 0);
  const [notes, setNotes] = useState(initial.result_notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/races/${raceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result_time: time || null,
        result_rank: rank || null,
        result_feeling: feeling || null,
        result_notes: notes || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'enregistrer.");
      return;
    }

    onSaved({
      result_time: time || null,
      result_rank: rank || null,
      result_feeling: feeling || null,
      result_notes: notes || null,
    });
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
          <div className="flex items-center gap-1.5 text-lg font-bold text-cap-black">
            <Trophy size={18} strokeWidth={2.25} className="text-cap-violet" />
            Vos résultats
          </div>
          <button
            onClick={onClose}
            className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted"
            aria-label="Fermer"
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">Temps</label>
            <NeoInput
              placeholder="45:30"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-cap-muted">Classement</label>
            <NeoInput
              placeholder="12e / 150"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Ressenti</label>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFeeling(feeling === value ? 0 : value)}
                  className="p-1"
                  aria-label={`${value} étoiles`}
                >
                  <Star
                    size={22}
                    strokeWidth={2}
                    className={
                      value <= feeling
                        ? "fill-cap-lime text-cap-lime"
                        : "text-cap-muted"
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-cap-muted">Notes</label>
          <NeoTextarea
            rows={3}
            placeholder="Sensations, météo, ce qui a bien/mal fonctionné..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <NeoButton
          type="button"
          variant="violet"
          onClick={save}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </NeoButton>
      </div>
    </div>
  );
}

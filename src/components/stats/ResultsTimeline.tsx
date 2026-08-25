import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Star, Trophy } from "lucide-react";
import type { Race } from "@/lib/types";

export function ResultsTimeline({ races }: { races: Race[] }) {
  if (races.length === 0) {
    return (
      <div className="neo p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-cap-black mb-1">
          Évolution des courses
        </h2>
        <p className="text-sm text-cap-muted">
          Aucune course passée pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="neo p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-cap-black mb-4">
        Évolution des courses
      </h2>
      <div className="flex flex-col divide-y divide-black/5">
        {races.map((race) => (
          <Link
            key={race.id}
            href={`/races/${race.id}`}
            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-cap-black truncate">{race.name}</p>
              <p className="text-xs text-cap-muted">
                {format(new Date(`${race.race_date}T00:00:00`), "d MMM yyyy", {
                  locale: fr,
                })}
                {race.distance_label ? ` — ${race.distance_label}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              {race.result_time ? (
                <span className="flex items-center gap-1 font-semibold text-cap-violet">
                  <Trophy size={12} strokeWidth={2.5} />
                  {race.result_time}
                </span>
              ) : (
                <span className="text-cap-muted">Pas de résultat</span>
              )}
              {race.result_feeling ? (
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={11}
                      strokeWidth={2}
                      className={
                        i < (race.result_feeling ?? 0)
                          ? "fill-cap-lime text-cap-lime"
                          : "text-cap-muted"
                      }
                    />
                  ))}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

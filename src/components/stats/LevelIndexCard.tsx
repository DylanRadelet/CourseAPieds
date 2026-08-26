import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Gauge, Trophy } from "lucide-react";
import type { LevelIndex } from "@/lib/level";
import { formatDistance } from "@/lib/format";
import { formatMinutesToDuration } from "@/lib/pace";

export function LevelIndexCard({ levelIndex }: { levelIndex: LevelIndex | null }) {
  if (!levelIndex) {
    return (
      <div className="neo p-6 flex items-center gap-4">
        <div className="neo-sm w-12 h-12 flex items-center justify-center text-cap-muted shrink-0">
          <Gauge size={22} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-cap-black">
            Indice de niveau
          </p>
          <p className="text-sm text-cap-muted mt-0.5">
            Pas encore assez de données — ajoute un résultat de course ou une sortie
            d&apos;au moins 3 km (distance + temps) dans l&apos;historique.
          </p>
        </div>
      </div>
    );
  }

  const effortDate = format(new Date(`${levelIndex.effort.date}T00:00:00`), "d MMM yyyy", {
    locale: fr,
  });

  return (
    <div className="neo p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="neo-sm w-16 h-16 flex items-center justify-center text-cap-violet shrink-0">
          {levelIndex.fromRace ? (
            <Trophy size={26} strokeWidth={2} />
          ) : (
            <Gauge size={26} strokeWidth={2} />
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-cap-muted">
            Indice de niveau
          </p>
          <p className="text-4xl font-extrabold text-cap-black leading-none mt-1">
            {levelIndex.score}
            <span className="text-base font-semibold text-cap-muted">/1000</span>
          </p>
        </div>
      </div>
      <p className="text-xs text-cap-muted sm:ml-auto sm:text-right sm:max-w-[220px]">
        Basé sur {levelIndex.fromRace ? "la course" : "la sortie"}{" "}
        <span className="font-semibold text-cap-black">
          {levelIndex.effort.label}
        </span>{" "}
        du {effortDate} — {formatDistance(levelIndex.effort.distanceKm)} en{" "}
        {formatMinutesToDuration(levelIndex.effort.durationMin)}.
        {!levelIndex.fromRace ? " (estimation basse — pas un effort maximal)" : ""}
      </p>
    </div>
  );
}

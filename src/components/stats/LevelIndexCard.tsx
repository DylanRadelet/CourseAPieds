import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dumbbell, Trophy } from "lucide-react";
import type { LevelIndex, LevelIndexResult } from "@/lib/level";
import { predictRaceTimes } from "@/lib/level";
import { formatDistance } from "@/lib/format";
import { formatMinutesToDuration } from "@/lib/pace";

function EstimateBlock({
  title,
  icon,
  estimate,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  estimate: LevelIndex | null;
  emptyLabel: string;
}) {
  return (
    <div className="flex-1 min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="neo-sm w-9 h-9 flex items-center justify-center text-cap-violet shrink-0">
          {icon}
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-cap-muted">{title}</p>
      </div>

      {estimate ? (
        <>
          <p className="text-3xl font-extrabold text-cap-black leading-none">
            {estimate.score}
            <span className="text-sm font-semibold text-cap-muted">/1000</span>
          </p>
          <p className="text-xs text-cap-muted mt-1.5">
            {estimate.effort.label} du{" "}
            {format(new Date(`${estimate.effort.date}T00:00:00`), "d MMM yyyy", {
              locale: fr,
            })}{" "}
            — {formatDistance(estimate.effort.distanceKm)} en{" "}
            {formatMinutesToDuration(estimate.effort.durationMin)}
          </p>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-xs">
            {predictRaceTimes(estimate.vdot).map((p) => (
              <div key={p.key} className="flex items-center justify-between neo-inset px-2.5 py-1.5">
                <span className="text-cap-muted">{p.label}</span>
                <span className="font-semibold text-cap-black">
                  {formatMinutesToDuration(p.durationMin)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-cap-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

export function LevelIndexCard({ levelIndex }: { levelIndex: LevelIndexResult }) {
  if (!levelIndex.training && !levelIndex.race) {
    return (
      <div className="neo p-6 text-sm text-cap-muted">
        Pas encore assez de données pour un indice de niveau — ajoute un résultat de
        course ou une sortie d&apos;au moins 3 km (distance + temps) dans
        l&apos;historique.
      </div>
    );
  }

  return (
    <div className="neo p-6 flex flex-col sm:flex-row gap-6">
      <EstimateBlock
        title="Estimation course"
        icon={<Trophy size={16} strokeWidth={2} />}
        estimate={levelIndex.race}
        emptyLabel="Aucune course chronométrée enregistrée pour l'instant."
      />
      <div className="hidden sm:block w-px bg-black/10" />
      <EstimateBlock
        title="Estimation entraînement"
        icon={<Dumbbell size={16} strokeWidth={2} />}
        estimate={levelIndex.training}
        emptyLabel="Aucune sortie exploitable (≥ 3 km, distance + temps) pour l'instant."
      />
    </div>
  );
}

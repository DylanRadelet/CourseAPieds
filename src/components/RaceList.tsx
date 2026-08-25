import type { Race } from "@/lib/types";
import { RaceCard } from "./RaceCard";

export function RaceList({ races }: { races: Race[] }) {
  if (races.length === 0) {
    return (
      <div className="neo p-8 text-center text-cap-muted text-sm">
        Aucune course pour l&apos;instant. Ajoute-en une pour démarrer ton plan
        d&apos;entraînement.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {races.map((race) => (
        <RaceCard key={race.id} race={race} />
      ))}
    </div>
  );
}

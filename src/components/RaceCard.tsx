"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, MapPin, Mountain, Pencil } from "lucide-react";
import type { Race } from "@/lib/types";
import { RecordCard } from "@/components/ui/RecordCard";
import { DeleteIconButton } from "@/components/ui/DeleteIconButton";
import { EditRaceModal } from "./EditRaceModal";

function countdown(raceDate: Date, today: Date) {
  const days = differenceInCalendarDays(raceDate, today);
  if (days < 0) return "Passée";
  if (days === 0) return "Aujourd'hui !";
  const weeks = differenceInCalendarWeeks(raceDate, today, { weekStartsOn: 1 });
  if (weeks <= 0) return `J-${days}`;
  return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
}

export function RaceCard({ race: initialRace }: { race: Race }) {
  const router = useRouter();
  const [race, setRace] = useState(initialRace);
  const [editing, setEditing] = useState(false);

  const today = new Date();
  const raceDate = new Date(`${race.race_date}T00:00:00`);

  return (
    <RecordCard
      header={
        <Link
          href={`/races/${race.id}`}
          className="text-lg font-bold text-cap-black hover:text-cap-violet transition-colors"
        >
          {race.name}
        </Link>
      }
      actions={
        <>
          <button
            onClick={() => setEditing(true)}
            className="neo-btn w-8 h-8 flex items-center justify-center text-cap-muted hover:text-cap-violet"
            title="Modifier"
            aria-label="Modifier la course"
          >
            <Pencil size={14} strokeWidth={2.25} />
          </button>
          <DeleteIconButton
            confirmTitle="Supprimer la course"
            confirmDescription={`"${race.name}" et tous ses entraînements seront définitivement supprimés.`}
            onConfirm={async () => {
              await fetch(`/api/races/${race.id}`, { method: "DELETE" });
              router.refresh();
            }}
          />
        </>
      }
    >
      <div className="flex items-center gap-1.5 text-sm text-cap-muted">
        <CalendarDays size={14} strokeWidth={2.25} />
        {format(raceDate, "EEEE d MMMM yyyy", { locale: fr })}
      </div>

      {race.distance_label || race.elevation_gain_m ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-cap-muted mt-1">
          {race.distance_label ? (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} strokeWidth={2.25} />
              {race.distance_label}
            </span>
          ) : null}
          {race.elevation_gain_m ? (
            <span className="flex items-center gap-1.5">
              <Mountain size={14} strokeWidth={2.25} />
              D+ {race.elevation_gain_m} m
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-cap-violet bg-cap-violet-soft">
          {countdown(raceDate, today)}
        </span>
      </div>

      {editing ? (
        <EditRaceModal
          race={race}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setRace(updated);
            setEditing(false);
          }}
        />
      ) : null}
    </RecordCard>
  );
}

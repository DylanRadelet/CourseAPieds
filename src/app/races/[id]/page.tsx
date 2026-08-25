import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarDays, MapPin, Mountain } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Sidebar } from "@/components/Sidebar";
import { WeekGrid } from "@/components/WeekGrid";
import { RaceResults } from "@/components/RaceResults";
import { getSupabaseServerClient } from "@/lib/supabase";
import { toDateKey } from "@/lib/weeks";
import type { Race, Workout } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RacePage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const [{ data: race, error: raceError }, { data: workouts }, { data: allRaces }] =
    await Promise.all([
      supabase.from("CAP_races").select("*").eq("id", id).single(),
      supabase
        .from("CAP_workouts")
        .select("*")
        .eq("race_id", id)
        .order("workout_date", { ascending: true }),
      supabase
        .from("CAP_races")
        .select("id, name, race_date")
        .order("race_date", { ascending: true }),
    ]);

  if (raceError || !race) {
    notFound();
  }

  const typedRace = race as Race;
  const raceDate = new Date(`${typedRace.race_date}T00:00:00`);
  const isPast = typedRace.race_date < toDateKey(new Date());

  const orderedRaces = (allRaces as Pick<Race, "id" | "name" | "race_date">[]) ?? [];
  const currentIndex = orderedRaces.findIndex((r) => r.id === typedRace.id);
  const previousRace = currentIndex > 0 ? orderedRaces[currentIndex - 1] : null;
  const nextRace =
    currentIndex >= 0 && currentIndex < orderedRaces.length - 1
      ? orderedRaces[currentIndex + 1]
      : null;

  return (
    <>
      <Sidebar />
      <main className="flex-1 px-4 pt-6 pb-28 sm:pl-28 sm:pr-8 sm:pt-8 sm:pb-12 max-w-5xl w-full mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-cap-muted hover:text-cap-black transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={2.25} />
            Retour aux courses
          </Link>

          <div className="flex items-center gap-2">
            {previousRace ? (
              <Link
                href={`/races/${previousRace.id}`}
                className="neo-btn flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cap-muted hover:text-cap-black"
                title={`Course précédente : ${previousRace.name}`}
              >
                <ChevronLeft size={14} strokeWidth={2.25} />
                {previousRace.name}
              </Link>
            ) : null}
            {nextRace ? (
              <Link
                href={`/races/${nextRace.id}`}
                className="neo-btn flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cap-muted hover:text-cap-black"
                title={`Course suivante : ${nextRace.name}`}
              >
                {nextRace.name}
                <ChevronRight size={14} strokeWidth={2.25} />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="neo p-6 mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-cap-black">
            {typedRace.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-cap-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} strokeWidth={2.25} />
              {format(raceDate, "EEEE d MMMM yyyy", { locale: fr })}
            </span>
            {typedRace.distance_label ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} strokeWidth={2.25} />
                {typedRace.distance_label}
              </span>
            ) : null}
            {typedRace.elevation_gain_m ? (
              <span className="flex items-center gap-1.5">
                <Mountain size={14} strokeWidth={2.25} />
                D+ {typedRace.elevation_gain_m} m
              </span>
            ) : null}
          </div>
          {typedRace.notes ? (
            <p className="text-sm text-cap-black/80 whitespace-pre-wrap pt-2 border-t border-black/5 mt-1">
              {typedRace.notes}
            </p>
          ) : null}
          {previousRace ? (
            <p className="text-xs text-cap-muted pt-1">
              Semaines affichées depuis {previousRace.name} (
              {format(new Date(`${previousRace.race_date}T00:00:00`), "d MMM", { locale: fr })}
              ).
            </p>
          ) : null}
        </div>

        {isPast ? (
          <div className="mb-6">
            <RaceResults raceId={typedRace.id} race={typedRace} />
          </div>
        ) : null}

        <WeekGrid
          raceId={typedRace.id}
          raceDateISO={typedRace.race_date}
          previousRaceDateISO={previousRace?.race_date}
          initialWorkouts={(workouts as Workout[]) ?? []}
        />
      </main>
    </>
  );
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { buildWeeks, toDateKey } from "@/lib/weeks";
import { generateTrainingPlan } from "@/lib/ai/trainingPlan";
import type { Profile, Race, Workout } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";
const PAST_RACES_LIMIT = 8;

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();

  const [
    { data: race, error: raceError },
    { data: allRaces, error: allRacesError },
    { data: workouts, error: workoutsError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase.from("CAP_races").select("*").eq("id", id).single(),
    supabase.from("CAP_races").select("*").order("race_date", { ascending: true }),
    supabase.from("CAP_workouts").select("workout_date").eq("race_id", id),
    supabase.from("CAP_profile").select("*").eq("id", PROFILE_ID).maybeSingle(),
  ]);

  if (raceError || !race) {
    return NextResponse.json({ error: "Course introuvable." }, { status: 404 });
  }
  if (allRacesError || workoutsError || profileError) {
    const message =
      allRacesError?.message || workoutsError?.message || profileError?.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const typedRace = race as Race;
  const orderedRaces = (allRaces as Race[]) ?? [];
  const currentIndex = orderedRaces.findIndex((r) => r.id === typedRace.id);
  const previousRace = currentIndex > 0 ? orderedRaces[currentIndex - 1] : null;

  const todayKey = toDateKey(new Date());
  const pastRaces = orderedRaces
    .filter((r) => r.id !== typedRace.id && r.race_date < todayKey)
    .sort((a, b) => (a.race_date < b.race_date ? 1 : -1))
    .slice(0, PAST_RACES_LIMIT);

  const raceDate = new Date(`${typedRace.race_date}T00:00:00`);
  const previousRaceDate = previousRace
    ? new Date(`${previousRace.race_date}T00:00:00`)
    : undefined;
  const weeks = buildWeeks(raceDate, { previousRaceDate });

  const filledDates = new Set(
    ((workouts as Pick<Workout, "workout_date">[]) ?? []).map((w) => w.workout_date)
  );
  const emptyDates = weeks
    .flatMap((week) => week.days)
    .map((day) => toDateKey(day))
    .filter((dateKey) => !filledDates.has(dateKey));

  try {
    const plan = await generateTrainingPlan({
      profile: (profile as Profile) ?? null,
      race: typedRace,
      previousRace: previousRace
        ? { name: previousRace.name, race_date: previousRace.race_date }
        : null,
      pastRaces,
      emptyDates,
    });
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur IA inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

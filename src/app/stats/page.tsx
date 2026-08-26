import { startOfWeek } from "date-fns";
import { CalendarCheck, Flag, ListChecks, Route } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { StatTile } from "@/components/stats/StatTile";
import { WeeklyVolumeChart } from "@/components/stats/WeeklyVolumeChart";
import { ResultsTimeline } from "@/components/stats/ResultsTimeline";
import { LevelIndexCard } from "@/components/stats/LevelIndexCard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { computeOverallStats, computeWeeklyVolume } from "@/lib/stats";
import { computeLevelIndex } from "@/lib/level";
import { toDateKey } from "@/lib/weeks";
import { formatDistance } from "@/lib/format";
import type { Activity, Race, Workout } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = getSupabaseServerClient();
  const [{ data: races }, { data: workouts }, { data: activities }] = await Promise.all([
    supabase.from("CAP_races").select("*").order("race_date", { ascending: true }),
    supabase.from("CAP_workouts").select("*"),
    supabase.from("CAP_activities").select("*"),
  ]);

  const typedRaces = (races as Race[]) ?? [];
  const typedWorkouts = (workouts as Workout[]) ?? [];
  const typedActivities = (activities as Activity[]) ?? [];
  const today = new Date();
  const todayKey = toDateKey(today);

  const stats = computeOverallStats(typedRaces, typedWorkouts, today);
  const levelIndex = computeLevelIndex(
    typedRaces,
    typedActivities,
    typedWorkouts.filter((w) => w.done)
  );
  const weeklyVolume = computeWeeklyVolume(typedWorkouts, today);
  const pastRaces = typedRaces
    .filter((r) => r.race_date < todayKey)
    .sort((a, b) => (a.race_date < b.race_date ? 1 : -1));

  const completionLabel =
    stats.completionRate === null ? "—" : `${Math.round(stats.completionRate * 100)}%`;

  return (
    <>
      <Sidebar />
      <main className="flex-1 px-4 pt-6 pb-28 sm:pl-28 sm:pr-8 sm:pt-8 sm:pb-8 max-w-5xl w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-cap-black mb-1">
            Statistiques
          </h1>
          <p className="text-sm text-cap-muted">
            Ton volume d&apos;entraînement et l&apos;évolution de tes courses.
          </p>
        </div>

        <LevelIndexCard levelIndex={levelIndex} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile
            label="Km parcourus"
            value={formatDistance(stats.kmDone)}
            icon={<Route size={14} strokeWidth={2.25} />}
          />
          <StatTile
            label="Séances faites"
            value={completionLabel}
            icon={<ListChecks size={14} strokeWidth={2.25} />}
          />
          <StatTile
            label="Courses terminées"
            value={`${stats.completedRaces}`}
            icon={<Flag size={14} strokeWidth={2.25} />}
          />
          <StatTile
            label="Courses à venir"
            value={`${stats.upcomingRaces}`}
            icon={<CalendarCheck size={14} strokeWidth={2.25} />}
          />
        </div>

        <WeeklyVolumeChart
          data={weeklyVolume}
          currentWeekStartISO={toDateKey(startOfWeek(today, { weekStartsOn: 1 }))}
        />

        <ResultsTimeline races={pastRaces} />
      </main>
    </>
  );
}

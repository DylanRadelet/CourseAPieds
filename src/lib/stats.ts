import {
  addWeeks,
  differenceInCalendarWeeks,
  format,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Race, Workout } from "@/lib/types";
import { toDateKey } from "@/lib/weeks";

export type OverallStats = {
  totalWorkouts: number;
  doneWorkouts: number;
  pastDueWorkouts: number;
  completionRate: number | null; // 0-1, null if no past-due workouts yet
  kmDone: number;
  kmPlannedTotal: number;
  totalRaces: number;
  completedRaces: number;
  upcomingRaces: number;
};

export function computeOverallStats(
  races: Race[],
  workouts: Workout[],
  today: Date
): OverallStats {
  const todayKey = toDateKey(today);

  const pastDue = workouts.filter((w) => w.workout_date <= todayKey);
  const doneWorkouts = workouts.filter((w) => w.done);
  const pastDueDone = pastDue.filter((w) => w.done);

  const kmDone = doneWorkouts.reduce((sum, w) => sum + (w.distance_km ?? 0), 0);
  const kmPlannedTotal = workouts.reduce((sum, w) => sum + (w.distance_km ?? 0), 0);

  const completedRaces = races.filter((r) => r.race_date < todayKey).length;

  return {
    totalWorkouts: workouts.length,
    doneWorkouts: doneWorkouts.length,
    pastDueWorkouts: pastDue.length,
    completionRate: pastDue.length > 0 ? pastDueDone.length / pastDue.length : null,
    kmDone: Math.round(kmDone * 10) / 10,
    kmPlannedTotal: Math.round(kmPlannedTotal * 10) / 10,
    totalRaces: races.length,
    completedRaces,
    upcomingRaces: races.length - completedRaces,
  };
}

export type WeeklyVolumePoint = {
  weekStart: Date;
  label: string;
  planned: number;
  done: number;
};

/**
 * Windows the chart around "today" rather than strictly trailing it — this
 * app is mostly about upcoming training blocks, so a history-only window
 * would show nothing for a runner who just planned their next race. The
 * window always covers at least a couple of weeks of context on each side
 * of today, and grows to also cover any workout further out than that.
 */
export function computeWeeklyVolume(workouts: Workout[], today: Date): WeeklyVolumePoint[] {
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const minSpanStart = subWeeks(currentWeekStart, 2);
  const minSpanEnd = addWeeks(currentWeekStart, 8);

  const weekStarts = workouts.map((w) =>
    startOfWeek(new Date(`${w.workout_date}T00:00:00`), { weekStartsOn: 1 })
  );

  let firstWeekStart = minSpanStart;
  let lastWeekStart = minSpanEnd;
  for (const weekStart of weekStarts) {
    if (weekStart < firstWeekStart) firstWeekStart = weekStart;
    if (weekStart > lastWeekStart) lastWeekStart = weekStart;
  }

  const weeksCount =
    differenceInCalendarWeeks(lastWeekStart, firstWeekStart, { weekStartsOn: 1 }) + 1;

  const byWeek = new Map<string, { planned: number; done: number }>();
  for (const w of workouts) {
    const workoutDate = new Date(`${w.workout_date}T00:00:00`);
    const weekKey = toDateKey(startOfWeek(workoutDate, { weekStartsOn: 1 }));
    const entry = byWeek.get(weekKey) ?? { planned: 0, done: 0 };
    entry.planned += w.distance_km ?? 0;
    if (w.done) entry.done += w.distance_km ?? 0;
    byWeek.set(weekKey, entry);
  }

  return Array.from({ length: weeksCount }, (_, i) => {
    const weekStart = addWeeks(firstWeekStart, i);
    const key = toDateKey(weekStart);
    const entry = byWeek.get(key) ?? { planned: 0, done: 0 };
    return {
      weekStart,
      label: format(weekStart, "d MMM", { locale: fr }),
      planned: Math.round(entry.planned * 10) / 10,
      done: Math.round(entry.done * 10) / 10,
    };
  });
}

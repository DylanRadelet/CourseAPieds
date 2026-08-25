import Link from "next/link";
import { addDays, isToday, startOfWeek } from "date-fns";
import { CalendarRange, Check } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase";
import { formatDayLabel, toDateKey } from "@/lib/weeks";
import type { Workout } from "@/lib/types";

type WorkoutWithRace = Workout & { race: { id: string; name: string } | null };

export async function ThisWeekWidget() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const supabase = getSupabaseServerClient();
  const { data: workouts } = await supabase
    .from("CAP_workouts")
    .select("*, race:CAP_races(id, name)")
    .gte("workout_date", toDateKey(weekDays[0]))
    .lte("workout_date", toDateKey(weekDays[6]));

  const byDate = new Map<string, WorkoutWithRace>();
  for (const w of (workouts as WorkoutWithRace[]) ?? []) {
    byDate.set(w.workout_date, w);
  }

  return (
    <div className="neo p-4 sm:p-6">
      <div className="flex items-center gap-1.5 mb-4">
        <CalendarRange size={15} strokeWidth={2.25} className="text-cap-violet" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-cap-black">
          Cette semaine
        </h2>
      </div>

      <div className="overflow-x-auto neo-scrollbar pb-1">
      <div className="flex gap-2 min-w-[700px] sm:min-w-0 sm:grid sm:grid-cols-7">
        {weekDays.map((day) => {
          const dateKey = toDateKey(day);
          const workout = byDate.get(dateKey);
          const today_ = isToday(day);

          const cell = (
            <div
              className={`neo-inset relative flex flex-col items-start gap-1 p-2 min-h-[84px] transition-transform ${
                workout?.race ? "hover:-translate-y-0.5" : ""
              }`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  today_ ? "text-cap-violet" : "text-cap-muted"
                }`}
              >
                {formatDayLabel(day)}
              </span>

              {workout?.title ? (
                <span
                  className={`text-xs font-medium leading-snug line-clamp-2 ${
                    workout.done ? "text-cap-muted line-through" : "text-cap-black"
                  }`}
                >
                  {workout.title}
                </span>
              ) : (
                <span className="text-xs text-cap-muted">Libre</span>
              )}

              {workout?.race ? (
                <span className="text-[10px] text-cap-muted truncate w-full mt-auto">
                  {workout.race.name}
                </span>
              ) : null}

              {workout?.done ? (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cap-lime flex items-center justify-center">
                  <Check size={10} strokeWidth={3} className="text-cap-black" />
                </span>
              ) : null}
            </div>
          );

          return (
            <div key={dateKey} className="w-[92px] shrink-0 sm:w-auto">
              {workout?.race ? (
                <Link href={`/races/${workout.race.id}`}>{cell}</Link>
              ) : (
                cell
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

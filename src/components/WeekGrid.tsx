"use client";

import { useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { isSameDay, isToday } from "date-fns";
import type { Workout } from "@/lib/types";
import { buildWeeks, formatDayLabel, formatWeekLabel, toDateKey } from "@/lib/weeks";
import { WorkoutModal } from "./WorkoutModal";
import { AIPlanButton } from "./AIPlanButton";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const GRID_COLS = "grid-cols-[92px_repeat(7,minmax(96px,1fr))]";

export function WeekGrid({
  raceId,
  raceDateISO,
  previousRaceDateISO,
  initialWorkouts,
}: {
  raceId: string;
  raceDateISO: string;
  previousRaceDateISO?: string | null;
  initialWorkouts: Workout[];
}) {
  const raceDate = useMemo(() => new Date(`${raceDateISO}T00:00:00`), [raceDateISO]);
  const previousRaceDate = useMemo(
    () => (previousRaceDateISO ? new Date(`${previousRaceDateISO}T00:00:00`) : undefined),
    [previousRaceDateISO]
  );
  const weeks = useMemo(
    () => buildWeeks(raceDate, { previousRaceDate }),
    [raceDate, previousRaceDate]
  );

  const [workoutsByDate, setWorkoutsByDate] = useState<Record<string, Workout>>(() => {
    const map: Record<string, Workout> = {};
    for (const w of initialWorkouts) map[w.workout_date] = w;
    return map;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  function handleSaved(workout: Workout | null, dateKey: string) {
    setWorkoutsByDate((prev) => {
      const next = { ...prev };
      if (workout) next[dateKey] = workout;
      else delete next[dateKey];
      return next;
    });
    setSelectedDate(null);
  }

  function handlePlanApplied(applied: Workout[]) {
    setWorkoutsByDate((prev) => {
      const next = { ...prev };
      for (const workout of applied) next[workout.workout_date] = workout;
      return next;
    });
  }

  return (
    <div className="neo p-4 sm:p-6">
      <div className="flex justify-end mb-4">
        <AIPlanButton raceId={raceId} onApplied={handlePlanApplied} />
      </div>
      <div className="overflow-x-auto neo-scrollbar pb-2">
        <div className="min-w-[820px]">
          <div className={`grid ${GRID_COLS} gap-2 mb-2`}>
            <div />
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-xs font-bold text-cap-muted uppercase tracking-wide py-1"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {weeks.map((week) => (
              <div
                key={week.weekStart.toISOString()}
                className={`grid ${GRID_COLS} gap-2`}
              >
                <div
                  className={`flex flex-col justify-center rounded-2xl px-2 text-center ${
                    week.isRaceWeek ? "bg-cap-lime-soft" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-cap-black">
                    {week.isRaceWeek ? "Course" : `S-${week.weeksToRace}`}
                  </span>
                  <span className="text-[10px] text-cap-muted">
                    {formatWeekLabel(week.weekStart)}
                  </span>
                </div>

                {week.days.map((day) => {
                  const dateKey = toDateKey(day);
                  const workout = workoutsByDate[dateKey];
                  const isRaceDay = isSameDay(day, raceDate);
                  const today = isToday(day);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={`neo-inset relative flex flex-col items-start gap-1 p-2 text-left min-h-[76px] transition-transform hover:-translate-y-0.5 ${
                        isRaceDay ? "ring-2 ring-cap-violet" : ""
                      }`}
                    >
                      <span
                        className={`text-[11px] font-semibold ${
                          today ? "text-cap-violet" : "text-cap-muted"
                        }`}
                      >
                        {formatDayLabel(day)}
                      </span>

                      {isRaceDay ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-cap-violet">
                          <Flag size={11} strokeWidth={2.5} />
                          Course
                        </span>
                      ) : null}

                      {workout?.title ? (
                        <span
                          className={`text-xs font-medium leading-snug line-clamp-2 ${
                            workout.done ? "text-cap-muted line-through" : "text-cap-black"
                          }`}
                        >
                          {workout.title}
                        </span>
                      ) : null}

                      {workout?.distance_km ? (
                        <span className="text-[10px] font-semibold text-cap-violet mt-auto">
                          {workout.distance_km} km
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDate ? (
        <WorkoutModal
          date={selectedDate}
          raceId={raceId}
          workout={workoutsByDate[toDateKey(selectedDate)]}
          onClose={() => setSelectedDate(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}

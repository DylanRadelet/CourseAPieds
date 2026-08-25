import {
  addDays,
  addWeeks,
  differenceInCalendarWeeks,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

export type WeekRow = {
  weekStart: Date;
  days: Date[]; // Monday -> Sunday
  weeksToRace: number; // 0 = race week, positive = weeks remaining
  isRaceWeek: boolean;
};

/**
 * Builds the grid of weeks for a race.
 *
 * - If `previousRaceDate` is given, the grid starts the week right after the
 *   previous race's week, so each race only shows the training block between
 *   it and the race before it (no repeated/overlapping weeks across races).
 * - Otherwise it starts from "today" (or the race date if it already
 *   passed), through the week containing the race date, inclusive.
 */
export function buildWeeks(
  raceDate: Date,
  options: { today?: Date; previousRaceDate?: Date } = {}
): WeekRow[] {
  const { today = new Date(), previousRaceDate } = options;
  const raceStart = startOfDay(raceDate);
  const raceWeekStart = startOfWeek(raceStart, { weekStartsOn: 1 });

  let firstWeekStart: Date;
  if (previousRaceDate) {
    const previousWeekStart = startOfWeek(startOfDay(previousRaceDate), {
      weekStartsOn: 1,
    });
    const afterPreviousWeek = addWeeks(previousWeekStart, 1);
    firstWeekStart = isAfter(afterPreviousWeek, raceWeekStart)
      ? raceWeekStart
      : afterPreviousWeek;
  } else {
    const todayStart = startOfDay(today);
    const gridStart = isBefore(raceStart, todayStart) ? raceStart : todayStart;
    firstWeekStart = startOfWeek(gridStart, { weekStartsOn: 1 });
  }

  const totalWeeks =
    differenceInCalendarWeeks(raceWeekStart, firstWeekStart, {
      weekStartsOn: 1,
    }) + 1;

  return Array.from({ length: Math.max(totalWeeks, 1) }, (_, i) => {
    const weekStart = addWeeks(firstWeekStart, i);
    const days = Array.from({ length: 7 }, (_, d) => addDays(weekStart, d));
    const weeksToRace = differenceInCalendarWeeks(raceWeekStart, weekStart, {
      weekStartsOn: 1,
    });
    return {
      weekStart,
      days,
      weeksToRace,
      isRaceWeek: weeksToRace === 0,
    };
  });
}

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function formatWeekLabel(date: Date) {
  return format(date, "d MMM", { locale: fr });
}

export function formatDayLabel(date: Date) {
  return format(date, "EEE d", { locale: fr });
}

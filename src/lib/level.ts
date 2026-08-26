import { parseDurationToMinutes } from "./pace";
import type { Activity, Race, Workout } from "./types";

/**
 * "CAP Index" — a 0-1000 fitness level score, in the spirit of the UTMB
 * Index. Built on Daniels & Gilbert's VDOT formula (the same math behind
 * most public running pace/VO2max calculators): a race-effort's distance
 * and time convert to a VO2max-equivalent number, which we then rescale to
 * 0-1000. Real races are trusted over training data — training paces are
 * run comfortably below max effort, so they systematically understate true
 * fitness; a race time is the closest thing to a maximal-effort test we have.
 */

const VDOT_FLOOR = 20; // ~ a brand new beginner
const VDOT_CEILING = 85; // ~ world-class

const RACE_DISTANCE_ALIASES: Record<string, number> = {
  marathon: 42.195,
  "semi-marathon": 21.0975,
  semi: 21.0975,
  "10k": 10,
  "5k": 5,
};

export function parseDistanceLabelToKm(label: string | null | undefined): number | null {
  if (!label) return null;
  const normalized = label.trim().toLowerCase();
  for (const [alias, km] of Object.entries(RACE_DISTANCE_ALIASES)) {
    if (normalized.includes(alias)) return km;
  }
  const match = normalized.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function estimateVdot(distanceKm: number, durationMin: number): number {
  const velocity = (distanceKm * 1000) / durationMin; // meters/minute
  const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity ** 2;
  const t = durationMin;
  const percentMax =
    0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
  return vo2 / percentMax;
}

function vdotToScore(vdot: number): number {
  const clamped = Math.max(VDOT_FLOOR, Math.min(VDOT_CEILING, vdot));
  return Math.round(((clamped - VDOT_FLOOR) / (VDOT_CEILING - VDOT_FLOOR)) * 1000);
}

export type LevelEffort = {
  date: string;
  distanceKm: number;
  durationMin: number;
  label: string;
  source: "race" | "activity" | "workout";
};

export type LevelIndex = {
  score: number;
  vdot: number;
  effort: LevelEffort;
  fromRace: boolean;
};

function bestEffort(efforts: LevelEffort[]): LevelIndex | null {
  let best: { effort: LevelEffort; vdot: number } | null = null;
  for (const effort of efforts) {
    if (effort.distanceKm < 3 || effort.durationMin <= 0) continue;
    const vdot = estimateVdot(effort.distanceKm, effort.durationMin);
    if (!best || vdot > best.vdot) best = { effort, vdot };
  }
  if (!best) return null;
  return {
    score: vdotToScore(best.vdot),
    vdot: Math.round(best.vdot * 10) / 10,
    effort: best.effort,
    fromRace: best.effort.source === "race",
  };
}

export function computeLevelIndex(
  races: Race[],
  activities: Activity[],
  completedWorkouts: Workout[]
): LevelIndex | null {
  const raceEfforts: LevelEffort[] = races.flatMap((r) => {
    const km = parseDistanceLabelToKm(r.distance_label);
    const min = r.result_time ? parseDurationToMinutes(r.result_time) : null;
    return km && min ? [{ date: r.race_date, distanceKm: km, durationMin: min, label: r.name, source: "race" as const }] : [];
  });

  // Races are a true maximal-effort test — prefer them exclusively when available.
  const fromRaces = bestEffort(raceEfforts);
  if (fromRaces) return fromRaces;

  const activityEfforts: LevelEffort[] = activities.flatMap((a) =>
    a.distance_km && a.duration_min
      ? [
          {
            date: a.activity_date,
            distanceKm: a.distance_km,
            durationMin: a.duration_min,
            label: a.title || "Sortie",
            source: "activity" as const,
          },
        ]
      : []
  );

  const workoutEfforts: LevelEffort[] = completedWorkouts.flatMap((w) =>
    w.actual_distance_km && w.actual_duration_min
      ? [
          {
            date: w.workout_date,
            distanceKm: w.actual_distance_km,
            durationMin: w.actual_duration_min,
            label: w.title || "Séance",
            source: "workout" as const,
          },
        ]
      : []
  );

  return bestEffort([...activityEfforts, ...workoutEfforts]);
}

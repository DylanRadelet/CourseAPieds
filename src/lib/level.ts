import { parseDurationToMinutes } from "./pace";
import type { Activity, Race, Workout } from "./types";

/**
 * "CAP Index" — a 0-1000 fitness level score, in the spirit of the UTMB
 * Index. Built on Daniels & Gilbert's VDOT formula (the same math behind
 * most public running pace/VO2max calculators): a race-effort's distance
 * and time convert to a VO2max-equivalent number, which we then rescale to
 * 0-1000.
 *
 * Training paces are run comfortably below max effort, so an index built
 * from training data alone systematically understates true fitness. We
 * compute both a training-based estimate and a race-based estimate
 * separately (rather than one overriding the other) so the gap between
 * "what training suggests" and "what a real race proved" stays visible.
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

/** Score + VDOT for one known effort, independent of any history — used to
 * grade a single race result on its own right after it's logged. */
export function scoreEffort(distanceKm: number, durationMin: number) {
  const vdot = estimateVdot(distanceKm, durationMin);
  return { score: vdotToScore(vdot), vdot: Math.round(vdot * 10) / 10 };
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
  };
}

export type LevelIndexResult = {
  training: LevelIndex | null;
  race: LevelIndex | null;
};

export function computeLevelIndex(
  races: Race[],
  activities: Activity[],
  completedWorkouts: Workout[]
): LevelIndexResult {
  const raceEfforts: LevelEffort[] = races.flatMap((r) => {
    const km = parseDistanceLabelToKm(r.distance_label);
    const min = r.result_time ? parseDurationToMinutes(r.result_time) : null;
    return km && min
      ? [{ date: r.race_date, distanceKm: km, durationMin: min, label: r.name, source: "race" as const }]
      : [];
  });

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

  return {
    training: bestEffort([...activityEfforts, ...workoutEfforts]),
    race: bestEffort(raceEfforts),
  };
}

const PREDICTION_DISTANCES: { key: string; label: string; km: number }[] = [
  { key: "5k", label: "5 km", km: 5 },
  { key: "10k", label: "10 km", km: 10 },
  { key: "semi", label: "Semi-marathon", km: 21.0975 },
  { key: "marathon", label: "Marathon", km: 42.195 },
];

export type RacePrediction = {
  key: string;
  label: string;
  distanceKm: number;
  durationMin: number;
};

/**
 * Equivalent-performance predictions across standard distances for a given
 * VDOT, via binary search over the (monotonic) VDOT-vs-duration curve — the
 * same idea as Daniels' equivalent race performance tables.
 */
export function predictRaceTimes(vdot: number): RacePrediction[] {
  return PREDICTION_DISTANCES.map(({ key, label, km }) => {
    let lo = km * 2; // ~2:00/km — unrealistically fast lower bound
    let hi = km * 15; // ~15:00/km — very slow upper bound
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const vdotAtMid = estimateVdot(km, mid);
      // VDOT decreases as duration grows for a fixed distance.
      if (vdotAtMid > vdot) lo = mid;
      else hi = mid;
    }
    return { key, label, distanceKm: km, durationMin: (lo + hi) / 2 };
  });
}

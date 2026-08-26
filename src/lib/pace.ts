/**
 * Parses a duration typed as "MM:SS" or "H:MM:SS" (how people naturally type
 * a Garmin time) into decimal minutes. Returns null if unparseable.
 */
export function parseDurationToMinutes(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    [hours, minutes, seconds] = parts.map(Number);
  } else if (parts.length === 2) {
    [minutes, seconds] = parts.map(Number);
  } else if (parts.length === 1) {
    minutes = Number(parts[0]);
  } else {
    return null;
  }

  const total = hours * 60 + minutes + seconds / 60;
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

/** Formats decimal minutes back into "MM:SS" (or "H:MM:SS" past an hour). */
export function formatMinutesToDuration(totalMinutes: number): string {
  const totalSeconds = Math.round(totalMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "M:SS/km" pace from a distance and duration, or null if either is missing/zero. */
export function computePace(
  distanceKm: number | null | undefined,
  durationMin: number | null | undefined
): string | null {
  if (!distanceKm || !durationMin) return null;
  const paceMinPerKm = durationMin / distanceKm;
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes;
  const normalizedSeconds = seconds === 60 ? 0 : seconds;
  return `${normalizedMinutes}:${String(normalizedSeconds).padStart(2, "0")}/km`;
}

/**
 * A distance label typed as a bare number ("21") is assumed to be
 * kilometers and gets " km" appended automatically. Anything else
 * ("Semi", "10 km", "Marathon") is left untouched.
 */
export function normalizeDistanceLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^\d+([.,]\d+)?$/.test(trimmed) ? `${trimmed.replace(",", ".")} km` : trimmed;
}

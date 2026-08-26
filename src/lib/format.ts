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

const distanceFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Every raw km number in the app renders through this — "1,2" becomes "1,20 km". */
export function formatDistance(km: number): string {
  return `${distanceFormatter.format(km)} km`;
}

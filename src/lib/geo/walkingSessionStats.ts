import { getDistanceMeters } from "./haversine";

/** Ignore GPS jumps larger than this when summing walked distance. */
const MAX_SEGMENT_METERS = 200;

/** Ignore segments shorter than this (typical GPS drift while stationary). */
const MIN_SEGMENT_METERS = 5;

/** Do not accumulate distance when reported accuracy is worse than this. */
const MAX_ACCURACY_METERS = 40;

export function accumulateWalkedMeters(
  previous: { lat: number; lng: number } | null,
  next: { lat: number; lng: number },
  totalMeters: number,
  accuracyMeters?: number,
): { last: { lat: number; lng: number }; totalMeters: number } {
  if (
    accuracyMeters != null &&
    Number.isFinite(accuracyMeters) &&
    accuracyMeters > MAX_ACCURACY_METERS
  ) {
    return { last: previous ?? next, totalMeters };
  }

  if (!previous) {
    return { last: next, totalMeters };
  }

  const segment = getDistanceMeters(
    previous.lat,
    previous.lng,
    next.lat,
    next.lng,
  );

  if (segment <= 0 || segment > MAX_SEGMENT_METERS) {
    return { last: next, totalMeters };
  }

  if (segment < MIN_SEGMENT_METERS) {
    return { last: previous, totalMeters };
  }

  return { last: next, totalMeters: totalMeters + segment };
}

export function formatWalkingElapsed(elapsedMs: number): string {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "0:00";

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

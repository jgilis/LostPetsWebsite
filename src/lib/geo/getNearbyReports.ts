import type { Report } from "@/src/lib/reports";
import { getDistanceMeters } from "./haversine";
import type { GeoPoint } from "./isWithinRadius";
import type { ProximityEvent } from "./types";

export const DEFAULT_NEARBY_RADIUS_METERS = 500;

export function getNearbyReports(
  reports: Report[],
  centerLocation: GeoPoint,
  radiusMeters: number,
): ProximityEvent[] {
  const computedAt = Date.now();
  const results: ProximityEvent[] = [];

  for (const report of reports) {
    const distanceMeters = getDistanceMeters(
      centerLocation.lat,
      centerLocation.lng,
      report.latitude,
      report.longitude,
    );

    if (distanceMeters <= radiusMeters) {
      results.push({
        report,
        distanceMeters,
        centerLat: centerLocation.lat,
        centerLng: centerLocation.lng,
        computedAt,
      });
    }
  }

  return results.sort((a, b) => {
    const distanceDelta = a.distanceMeters - b.distanceMeters;
    if (distanceDelta !== 0) return distanceDelta;
    return a.report.id.localeCompare(b.report.id);
  });
}

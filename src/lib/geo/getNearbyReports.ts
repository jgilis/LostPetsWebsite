import type { Report } from "@/src/lib/reports";
import { getDistanceMeters } from "./haversine";
import type { GeoPoint } from "./isWithinRadius";

export const DEFAULT_NEARBY_RADIUS_METERS = 500;

export type NearbyReportResult = {
  report: Report;
  distanceMeters: number;
};

export function getNearbyReports(
  reports: Report[],
  centerLocation: GeoPoint,
  radiusMeters: number,
): NearbyReportResult[] {
  const results: NearbyReportResult[] = [];

  for (const report of reports) {
    const distanceMeters = getDistanceMeters(
      centerLocation.lat,
      centerLocation.lng,
      report.latitude,
      report.longitude,
    );

    if (distanceMeters <= radiusMeters) {
      results.push({ report, distanceMeters });
    }
  }

  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

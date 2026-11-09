import type { Report } from "@/src/lib/reports";
import { getDistanceMeters } from "./haversine";

export type DiscoverSortOrigin = {
  lat: number;
  lng: number;
};

function reportSortTime(report: Report): number {
  const raw = report.date_reported ?? report.created_at;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortDiscoverReports(
  reports: Report[],
  origin: DiscoverSortOrigin | null,
): Report[] {
  const copy = [...reports];
  if (origin) {
    copy.sort((a, b) => {
      const distanceDelta =
        getDistanceMeters(origin.lat, origin.lng, a.latitude, a.longitude) -
        getDistanceMeters(origin.lat, origin.lng, b.latitude, b.longitude);
      if (distanceDelta !== 0) return distanceDelta;
      return a.id.localeCompare(b.id);
    });
    return copy;
  }

  copy.sort((a, b) => {
    const timeDelta = reportSortTime(b) - reportSortTime(a);
    if (timeDelta !== 0) return timeDelta;
    return a.id.localeCompare(b.id);
  });
  return copy;
}

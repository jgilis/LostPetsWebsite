import {
  filterReportsInBounds,
  type MapBoundsBox,
} from "@/src/lib/geo/reportInBounds";
import type { Report } from "@/src/lib/reports";

/** Active lost reports inside the Discover camera. Ignores species/type filters. */
export function lostReportsInDiscoverCamera(
  reports: Report[],
  bounds: MapBoundsBox | null,
): Report[] {
  return filterReportsInBounds(reports, bounds).filter(
    (report) => report.type === "lost" && report.status === "active",
  );
}

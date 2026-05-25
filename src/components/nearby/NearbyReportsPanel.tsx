"use client";

import { memo, useMemo } from "react";
import type { Report } from "@/src/lib/reports";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  getNearbyReports,
} from "@/src/lib/geo/getNearbyReports";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import ProximityEventRow from "./ProximityEventRow";

type NearbyReportsPanelProps = {
  centerLocation: GeoPoint | null;
  reports: Report[];
  radiusMeters?: number;
};

function NearbyReportsPanel({
  centerLocation,
  reports,
  radiusMeters = DEFAULT_NEARBY_RADIUS_METERS,
}: NearbyReportsPanelProps) {
  const nearby = useMemo(() => {
    if (!centerLocation) return [];

    return getNearbyReports(reports, centerLocation, radiusMeters);
  }, [centerLocation, reports, radiusMeters]);

  if (!centerLocation) return null;

  return (
    <section
      className="mt-3 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2"
      aria-label="Nearby reports"
    >
      <h3 className="text-sm font-medium text-gray-400">
        Nearby reports ({radiusMeters}m)
      </h3>

      {nearby.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No reports in this area.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {nearby.map((event) => (
            <ProximityEventRow key={event.report.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default memo(NearbyReportsPanel);

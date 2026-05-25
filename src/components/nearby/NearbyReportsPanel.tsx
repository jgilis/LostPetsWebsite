"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import type { Report } from "@/src/lib/reports";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  getNearbyReports,
} from "@/src/lib/geo/getNearbyReports";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import { reportDetailHref } from "@/src/lib/reportNavigation";

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
          {nearby.map(({ report, distanceMeters }) => {
            const title =
              report.animal_name?.trim() ||
              `${report.type} ${report.animal_type}`;

            return (
              <li key={report.id} className="text-sm text-gray-300">
                <Link
                  href={reportDetailHref(report.id, "map")}
                  className="text-gray-200 hover:text-white hover:underline"
                >
                  {title}
                </Link>
                <span className="text-gray-500">
                  {" "}
                  · {Math.round(distanceMeters)}m
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default memo(NearbyReportsPanel);

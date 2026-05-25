"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { Report } from "@/src/lib/reports";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  getNearbyReports,
} from "@/src/lib/geo/getNearbyReports";
import type { ProximityEvent } from "@/src/lib/geo/types";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import { reportDetailHref } from "@/src/lib/reportNavigation";

type ScanSnapshot = {
  events: ProximityEvent[];
  scannedAt: number;
  center: GeoPoint;
};

type NearbyReportsScanProps = {
  mapCenterLocation: GeoPoint;
  reports: Report[];
  radiusMeters?: number;
};

function NearbyReportsScan({
  mapCenterLocation,
  reports,
  radiusMeters = DEFAULT_NEARBY_RADIUS_METERS,
}: NearbyReportsScanProps) {
  const lastCenterRef = useRef(mapCenterLocation);
  const [snapshot, setSnapshot] = useState<ScanSnapshot | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    lastCenterRef.current = mapCenterLocation;
  }, [mapCenterLocation]);

  const handleScan = useCallback(() => {
    const center = mapCenterLocation ?? lastCenterRef.current;
    if (!center) return;

    setIsScanning(true);
    setSnapshot(null);

    const events = getNearbyReports(reports, center, radiusMeters);

    setSnapshot({
      events,
      scannedAt: Date.now(),
      center,
    });
    setIsScanning(false);
  }, [mapCenterLocation, reports, radiusMeters]);

  return (
    <section
      className="mt-3 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2"
      aria-label="Scan nearby reports"
    >
      <button
        type="button"
        onClick={handleScan}
        disabled={isScanning}
        className="rounded-md bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600 disabled:opacity-60"
      >
        Scan nearby reports
      </button>

      {isScanning ? (
        <p className="mt-2 text-sm text-gray-500">Scanning...</p>
      ) : null}

      {snapshot && !isScanning ? (
        <div className="mt-2">
          <p className="text-xs text-gray-500">
            Snapshot · {radiusMeters}m from map center
          </p>

          {snapshot.events.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No reports in this area.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {snapshot.events.map((event) => {
                const { report, distanceMeters } = event;
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
        </div>
      ) : null}
    </section>
  );
}

export default memo(NearbyReportsScan);

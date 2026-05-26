"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Report } from "@/src/lib/reports";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  getNearbyReports,
} from "@/src/lib/geo/getNearbyReports";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import ProximityEventRow from "./ProximityEventRow";

type NearbyAwarenessProps = {
  centerLocation: GeoPoint | null;
  reports: Report[];
  radiusMeters?: number;
};

function NearbyAwareness({
  centerLocation,
  reports,
  radiusMeters = DEFAULT_NEARBY_RADIUS_METERS,
}: NearbyAwarenessProps) {
  const lastCenterRef = useRef<GeoPoint | null>(centerLocation);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (centerLocation) {
      lastCenterRef.current = centerLocation;
    }
  }, [centerLocation]);

  const nearby = useMemo(() => {
    const center = centerLocation ?? lastCenterRef.current;
    if (!center) return [];

    return getNearbyReports(reports, center, radiusMeters);
  }, [centerLocation, reports, radiusMeters, refreshToken]);

  const handleRefresh = useCallback(() => {
    const center = centerLocation ?? lastCenterRef.current;
    if (!center) return;

    setIsRefreshing(true);
    setRefreshToken((token) => token + 1);
    setIsRefreshing(false);
  }, [centerLocation]);

  if (!centerLocation && !lastCenterRef.current) return null;

  return (
    <section
      className="mt-3 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2"
      aria-label="Nearby awareness"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium text-gray-400">
          Nearby awareness ({radiusMeters}m)
        </h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-md bg-gray-700 px-3 py-1.5 text-xs text-white hover:bg-gray-600 disabled:opacity-60"
        >
          Refresh nearby
        </button>
      </div>

      {isRefreshing ? (
        <p className="mt-2 text-sm text-gray-500">Refreshing...</p>
      ) : null}

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

export default memo(NearbyAwareness);

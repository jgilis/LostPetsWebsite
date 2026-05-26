"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Report } from "@/src/lib/reports";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  getNearbyReports,
} from "@/src/lib/geo/getNearbyReports";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import {
  areProximityCentersEqual,
  stabilizeProximityCenter,
} from "@/src/lib/geo/center/stabilizeProximityCenter";
import { useWalkingMode } from "@/src/hooks/useWalkingMode";
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
  const lastMapCenterRef = useRef<GeoPoint | null>(
    centerLocation ? stabilizeProximityCenter(centerLocation) : null,
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    isWalkingModeEnabled,
    currentUserLocation,
    startWalkingMode,
    stopWalkingMode,
  } = useWalkingMode();

  const stabilizedMapCenter = useMemo(() => {
    const raw = centerLocation ?? lastMapCenterRef.current;
    if (!raw) return null;
    return stabilizeProximityCenter(raw);
  }, [centerLocation]);

  useEffect(() => {
    if (!centerLocation) return;

    const stabilized = stabilizeProximityCenter(centerLocation);
    if (areProximityCentersEqual(lastMapCenterRef.current, stabilized)) {
      return;
    }

    lastMapCenterRef.current = stabilized;
  }, [centerLocation]);

  const awarenessCenter = useMemo(() => {
    if (isWalkingModeEnabled) {
      return currentUserLocation ?? stabilizedMapCenter ?? lastMapCenterRef.current;
    }

    return stabilizedMapCenter ?? lastMapCenterRef.current;
  }, [
    isWalkingModeEnabled,
    currentUserLocation,
    stabilizedMapCenter,
  ]);

  const nearby = useMemo(() => {
    if (!awarenessCenter) return [];

    return getNearbyReports(reports, awarenessCenter, radiusMeters);
  }, [awarenessCenter, reports, radiusMeters, refreshToken]);

  const handleRefresh = useCallback(() => {
    if (!awarenessCenter) return;

    setIsRefreshing(true);
    setRefreshToken((token) => token + 1);
    setIsRefreshing(false);
  }, [awarenessCenter]);

  const handleWalkingModeToggle = useCallback(() => {
    if (isWalkingModeEnabled) {
      stopWalkingMode();
    } else {
      startWalkingMode();
    }
  }, [isWalkingModeEnabled, startWalkingMode, stopWalkingMode]);

  if (!stabilizedMapCenter && !lastMapCenterRef.current && !currentUserLocation) {
    return null;
  }

  const isAwaitingGpsFix =
    isWalkingModeEnabled && !currentUserLocation && !!awarenessCenter;

  const centerStatusLabel = isWalkingModeEnabled
    ? isAwaitingGpsFix
      ? "Using map center until GPS fix"
      : "Using your location"
    : "Using map center";

  const showList = !!awarenessCenter && !isRefreshing;
  const showEmpty = showList && nearby.length === 0;

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
          disabled={isRefreshing || !awarenessCenter}
          className="rounded-md bg-gray-700 px-3 py-1.5 text-xs text-white hover:bg-gray-600 disabled:opacity-60"
        >
          Refresh nearby
        </button>
        <button
          type="button"
          onClick={handleWalkingModeToggle}
          className="rounded-md bg-gray-700 px-3 py-1.5 text-xs text-white hover:bg-gray-600"
        >
          {isWalkingModeEnabled
            ? "Stop Walking Mode"
            : "Start Walking Mode"}
        </button>
      </div>

      <p className="mt-1 text-xs text-gray-500">{centerStatusLabel}</p>

      {isRefreshing ? (
        <p className="mt-2 text-sm text-gray-500">Refreshing...</p>
      ) : null}

      {showEmpty ? (
        <p className="mt-2 text-sm text-gray-500">No nearby reports</p>
      ) : null}

      {showList && nearby.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {nearby.map((event) => (
            <ProximityEventRow key={event.report.id} event={event} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default memo(NearbyAwareness);

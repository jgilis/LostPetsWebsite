"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Report } from "@/src/lib/reports";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  getNearbyReports,
} from "@/src/lib/geo/getNearbyReports";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import { formatProximityDistance } from "@/src/lib/geo/formatProximityDistance";
import {
  areProximityCentersEqual,
  stabilizeProximityCenter,
} from "@/src/lib/geo/center/stabilizeProximityCenter";
import type { UseWalkingModeResult } from "@/src/hooks/useWalkingMode";
import { track } from "@/src/lib/analytics/analytics";
import ProximityEventRow from "./ProximityEventRow";

type NearbyAwarenessProps = {
  centerLocation: GeoPoint | null;
  reports: Report[];
  radiusMeters?: number;
  walkingMode: UseWalkingModeResult;
};

function NearbyAwareness({
  centerLocation,
  reports,
  radiusMeters = DEFAULT_NEARBY_RADIUS_METERS,
  walkingMode,
}: NearbyAwarenessProps) {
  const lastMapCenterRef = useRef<GeoPoint | null>(
    centerLocation ? stabilizeProximityCenter(centerLocation) : null,
  );
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastNearbyTrackedRef = useRef<string | null>(null);

  const {
    isWalkingModeEnabled,
    livePosition,
    hasActiveUserLocation,
    sessionStats,
    startWalkingMode,
    stopWalkingMode,
  } = walkingMode;

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
    if (isWalkingModeEnabled && hasActiveUserLocation && livePosition) {
      return { lat: livePosition.lat, lng: livePosition.lng };
    }

    return stabilizedMapCenter ?? lastMapCenterRef.current;
  }, [
    isWalkingModeEnabled,
    hasActiveUserLocation,
    livePosition,
    stabilizedMapCenter,
  ]);

  const nearby = useMemo(() => {
    if (!awarenessCenter) return [];

    return getNearbyReports(reports, awarenessCenter, radiusMeters);
  }, [awarenessCenter, reports, radiusMeters, refreshToken]);

  const isWaitingForGps =
    isWalkingModeEnabled && !hasActiveUserLocation;

  const systemStatusMessage = useMemo(() => {
    if (isRefreshing) {
      return "Updating nearby reports…";
    }

    if (isWaitingForGps) {
      return "Waiting for location…";
    }

    if (isWalkingModeEnabled && hasActiveUserLocation) {
      return "Using your location";
    }

    return "Using map view";
  }, [
    isRefreshing,
    isWaitingForGps,
    isWalkingModeEnabled,
    hasActiveUserLocation,
  ]);

  const handleRefresh = useCallback(() => {
    if (!awarenessCenter || isWaitingForGps) return;

    setIsRefreshing(true);
    window.requestAnimationFrame(() => {
      setRefreshToken((token) => token + 1);
      setIsRefreshing(false);
    });
  }, [awarenessCenter, isWaitingForGps]);

  const handleWalkingModeToggle = useCallback(() => {
    if (isWalkingModeEnabled) {
      stopWalkingMode();
    } else {
      startWalkingMode();
    }
  }, [isWalkingModeEnabled, startWalkingMode, stopWalkingMode]);

  const canShowResults = !isRefreshing && !isWaitingForGps;
  const showList = canShowResults && nearby.length > 0;
  const showEmpty = canShowResults && !!awarenessCenter && nearby.length === 0;

  useEffect(() => {
    if (!showList || !awarenessCenter) return;

    const reportIds = nearby
      .map((event) => event.report.id)
      .sort()
      .join(",");
    const stabilizedCenter = stabilizeProximityCenter(awarenessCenter);
    const signature = `${stabilizedCenter.lat},${stabilizedCenter.lng}:${reportIds}`;

    if (lastNearbyTrackedRef.current === signature) return;
    lastNearbyTrackedRef.current = signature;

    track("nearby_viewed", {
      count: nearby.length,
    });
  }, [showList, awarenessCenter, nearby]);

  if (!stabilizedMapCenter && !lastMapCenterRef.current && !livePosition) {
    return null;
  }

  return (
    <section
      className="nearby-awareness-panel mt-3 rounded-lg border border-gray-700/80 bg-gray-900/40 px-3 py-2"
      aria-label="Nearby awareness"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium text-gray-400">
          Nearby reports
        </h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || !awarenessCenter || isWaitingForGps}
          className="nearby-refresh-btn rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          Refresh nearby
        </button>
        <button
          type="button"
          onClick={handleWalkingModeToggle}
          aria-pressed={isWalkingModeEnabled}
          className={
            isWalkingModeEnabled
              ? "rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-200 ring-1 ring-gray-600"
              : "rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700"
          }
        >
          {isWalkingModeEnabled
            ? "Walking mode on"
            : "Walking mode off"}
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-400" role="status">
        {systemStatusMessage}
      </p>

      {isWalkingModeEnabled && hasActiveUserLocation ? (
        <p className="mt-1 text-xs text-gray-500">
          Session: {sessionStats.elapsedLabel} ·{" "}
          {formatProximityDistance(sessionStats.distanceMeters)} walked
        </p>
      ) : null}

      {showEmpty ? (
        <p className="mt-2 text-sm text-gray-500">No nearby reports</p>
      ) : null}

      {showList ? (
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

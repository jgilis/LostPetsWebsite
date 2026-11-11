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
      className="nearby-awareness-panel mt-3 rounded-2xl border border-lp-line bg-lp-paper px-3 py-2"
      aria-label="Nearby awareness"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium text-lp-ink-muted">
          Nearby reports
        </h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || !awarenessCenter || isWaitingForGps}
          className="nearby-refresh-btn min-h-11 rounded-full bg-lp-sage-soft px-3 py-1.5 text-xs text-lp-sage-dark hover:bg-lp-sage/20 disabled:opacity-50"
        >
          Refresh nearby
        </button>
      </div>

      <p className="mt-2 text-sm text-lp-ink-muted" role="status">
        {systemStatusMessage}
      </p>

      {isWalkingModeEnabled && hasActiveUserLocation ? (
        <p className="mt-1 text-xs text-lp-ink-subtle">
          Session: {sessionStats.elapsedLabel} ·{" "}
          {formatProximityDistance(sessionStats.distanceMeters)} walked
        </p>
      ) : null}

      {showEmpty ? (
        <p className="mt-2 text-sm text-lp-ink-subtle">No nearby reports</p>
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

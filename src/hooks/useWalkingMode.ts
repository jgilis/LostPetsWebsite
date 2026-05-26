"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  areProximityCentersEqual,
  stabilizeProximityCenter,
} from "@/src/lib/geo/center/stabilizeProximityCenter";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import {
  browserClearWatch,
  browserGetCurrentPosition,
  browserWatchPosition,
  isBrowserGeolocationAvailable,
  WALKING_GEO_OPTIONS,
  type GeolocationWatchId,
} from "@/src/lib/platform/browserGeolocation";
import {
  isDocumentVisible,
  onDocumentVisibilityChange,
} from "@/src/lib/platform/browserDocument";
import { track } from "@/src/lib/analytics/analytics";

const STALE_LOCATION_MS = 60_000;
const LOCATION_FRESHNESS_CHECK_MS = 15_000;

function applyLocationUpdate(
  previous: GeoPoint | null,
  next: GeoPoint,
): GeoPoint | null {
  const stabilized = stabilizeProximityCenter(next);
  if (previous && areProximityCentersEqual(previous, stabilized)) {
    return previous;
  }
  return stabilized;
}

export function useWalkingMode() {
  const [isWalkingModeEnabled, setIsWalkingModeEnabled] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] =
    useState<GeoPoint | null>(null);
  const [locationFreshnessTick, setLocationFreshnessTick] = useState(0);
  const watchIdRef = useRef<GeolocationWatchId | null>(null);
  const sessionRef = useRef(0);
  const lastLocationAtRef = useRef(0);
  const isWalkingModeEnabledRef = useRef(false);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current == null) return;
    browserClearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  const applyPositionUpdate = useCallback((position: GeolocationPosition) => {
    lastLocationAtRef.current = Date.now();
    setCurrentUserLocation((previous) =>
      applyLocationUpdate(previous, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
    );
  }, []);

  const startWatch = useCallback(
    (session: number) => {
      if (!isBrowserGeolocationAvailable()) return;

      clearWatch();
      const watchId = browserWatchPosition(
        (update) => {
          if (session !== sessionRef.current) return;
          applyPositionUpdate(update);
        },
        () => {
          if (session !== sessionRef.current) return;
          clearWatch();
          setCurrentUserLocation(null);
        },
        WALKING_GEO_OPTIONS,
      );

      watchIdRef.current = watchId;
    },
    [applyPositionUpdate, clearWatch],
  );

  const stopWalkingMode = useCallback(() => {
    sessionRef.current += 1;
    clearWatch();
    lastLocationAtRef.current = 0;
    if (isWalkingModeEnabledRef.current) {
      track("walking_mode_disabled");
    }
    isWalkingModeEnabledRef.current = false;
    setIsWalkingModeEnabled(false);
    setCurrentUserLocation(null);
  }, [clearWatch]);

  const startWalkingMode = useCallback(() => {
    if (!isBrowserGeolocationAvailable()) return;

    const session = sessionRef.current + 1;
    sessionRef.current = session;
    isWalkingModeEnabledRef.current = true;
    setIsWalkingModeEnabled(true);
    track("walking_mode_enabled");

    browserGetCurrentPosition(
      (position) => {
        if (session !== sessionRef.current) return;
        applyPositionUpdate(position);
        startWatch(session);
      },
      () => {
        if (session !== sessionRef.current) return;
        stopWalkingMode();
      },
      WALKING_GEO_OPTIONS,
    );
  }, [applyPositionUpdate, startWatch, stopWalkingMode]);

  const hasActiveUserLocation =
    isWalkingModeEnabled &&
    currentUserLocation != null &&
    Date.now() - lastLocationAtRef.current < STALE_LOCATION_MS;

  useEffect(() => {
    if (!isWalkingModeEnabled) return;

    const intervalId = window.setInterval(() => {
      setLocationFreshnessTick((tick) => tick + 1);
    }, LOCATION_FRESHNESS_CHECK_MS);

    return () => window.clearInterval(intervalId);
  }, [isWalkingModeEnabled]);

  useEffect(() => {
    if (!isWalkingModeEnabled || !currentUserLocation) return;

    const isStale =
      Date.now() - lastLocationAtRef.current >= STALE_LOCATION_MS;
    if (!isStale) return;

    clearWatch();
    setCurrentUserLocation(null);
  }, [isWalkingModeEnabled, currentUserLocation, locationFreshnessTick, clearWatch]);

  useEffect(() => {
    if (!isWalkingModeEnabled) return;

    return onDocumentVisibilityChange(() => {
      if (!isDocumentVisible()) return;

      setLocationFreshnessTick((tick) => tick + 1);

      if (watchIdRef.current != null) return;

      const session = sessionRef.current;
      if (currentUserLocation) {
        startWatch(session);
        return;
      }

      if (!isBrowserGeolocationAvailable()) return;

      browserGetCurrentPosition(
        (position) => {
          if (session !== sessionRef.current) return;
          applyPositionUpdate(position);
          startWatch(session);
        },
        () => {
          if (session !== sessionRef.current) return;
        },
        WALKING_GEO_OPTIONS,
      );
    });
  }, [
    isWalkingModeEnabled,
    currentUserLocation,
    applyPositionUpdate,
    startWatch,
  ]);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      clearWatch();
    };
  }, [clearWatch]);

  return {
    isWalkingModeEnabled,
    currentUserLocation,
    hasActiveUserLocation,
    startWalkingMode,
    stopWalkingMode,
  };
}

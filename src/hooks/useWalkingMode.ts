"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  areProximityCentersEqual,
  stabilizeProximityCenter,
} from "@/src/lib/geo/center/stabilizeProximityCenter";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10_000,
  timeout: 15_000,
};

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
  const watchIdRef = useRef<number | null>(null);
  const sessionRef = useRef(0);
  const lastLocationAtRef = useRef(0);

  const clearWatch = useCallback(() => {
    if (
      watchIdRef.current != null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        return;
      }

      clearWatch();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (update) => {
          if (session !== sessionRef.current) return;
          applyPositionUpdate(update);
        },
        () => {
          if (session !== sessionRef.current) return;
          clearWatch();
          setCurrentUserLocation(null);
        },
        GEO_OPTIONS,
      );
    },
    [applyPositionUpdate, clearWatch],
  );

  const stopWalkingMode = useCallback(() => {
    sessionRef.current += 1;
    clearWatch();
    lastLocationAtRef.current = 0;
    setIsWalkingModeEnabled(false);
    setCurrentUserLocation(null);
  }, [clearWatch]);

  const startWalkingMode = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const session = sessionRef.current + 1;
    sessionRef.current = session;
    setIsWalkingModeEnabled(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (session !== sessionRef.current) return;
        applyPositionUpdate(position);
        startWatch(session);
      },
      () => {
        if (session !== sessionRef.current) return;
        stopWalkingMode();
      },
      GEO_OPTIONS,
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
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!isWalkingModeEnabled) return;

      setLocationFreshnessTick((tick) => tick + 1);

      if (watchIdRef.current != null) return;

      const session = sessionRef.current;
      if (currentUserLocation) {
        startWatch(session);
        return;
      }

      navigator.geolocation?.getCurrentPosition(
        (position) => {
          if (session !== sessionRef.current) return;
          applyPositionUpdate(position);
          startWatch(session);
        },
        () => {
          if (session !== sessionRef.current) return;
        },
        GEO_OPTIONS,
      );
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
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

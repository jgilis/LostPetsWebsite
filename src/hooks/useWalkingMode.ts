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
  const watchIdRef = useRef<number | null>(null);
  const sessionRef = useRef(0);

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

  const stopWalkingMode = useCallback(() => {
    sessionRef.current += 1;
    clearWatch();
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

        setCurrentUserLocation((previous) =>
          applyLocationUpdate(previous, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        );

        clearWatch();
        watchIdRef.current = navigator.geolocation.watchPosition(
          (update) => {
            if (session !== sessionRef.current) return;

            setCurrentUserLocation((previous) =>
              applyLocationUpdate(previous, {
                lat: update.coords.latitude,
                lng: update.coords.longitude,
              }),
            );
          },
          () => {
            if (session !== sessionRef.current) return;
            stopWalkingMode();
          },
          GEO_OPTIONS,
        );
      },
      () => {
        if (session !== sessionRef.current) return;
        stopWalkingMode();
      },
      GEO_OPTIONS,
    );
  }, [clearWatch, stopWalkingMode]);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      clearWatch();
    };
  }, [clearWatch]);

  return {
    isWalkingModeEnabled,
    currentUserLocation,
    startWalkingMode,
    stopWalkingMode,
  };
}

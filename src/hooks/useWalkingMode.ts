"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10_000,
  timeout: 15_000,
};

export function useWalkingMode() {
  const [isWalkingModeEnabled, setIsWalkingModeEnabled] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] =
    useState<GeoPoint | null>(null);
  const watchIdRef = useRef<number | null>(null);

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
    clearWatch();
    setIsWalkingModeEnabled(false);
    setCurrentUserLocation(null);
  }, [clearWatch]);

  const startWalkingMode = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    setIsWalkingModeEnabled(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        watchIdRef.current = navigator.geolocation.watchPosition(
          (update) => {
            setCurrentUserLocation({
              lat: update.coords.latitude,
              lng: update.coords.longitude,
            });
          },
          () => {
            stopWalkingMode();
          },
          GEO_OPTIONS,
        );
      },
      () => {
        stopWalkingMode();
      },
      GEO_OPTIONS,
    );
  }, [stopWalkingMode]);

  useEffect(() => {
    return () => {
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

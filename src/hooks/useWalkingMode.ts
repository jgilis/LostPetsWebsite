"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import {
  accumulateWalkedMeters,
  formatWalkingElapsed,
} from "@/src/lib/geo/walkingSessionStats";
import {
  browserClearWatch,
  browserGetCurrentPosition,
  browserWatchPosition,
  isBrowserGeolocationAvailable,
  WALKING_GEO_OPTIONS,
  WALKING_WATCH_OPTIONS,
  type GeolocationWatchId,
} from "@/src/lib/platform/browserGeolocation";
import {
  isDocumentVisible,
  onDocumentVisibilityChange,
} from "@/src/lib/platform/browserDocument";
import { track } from "@/src/lib/analytics/analytics";

const STALE_LOCATION_MS = 60_000;
const LOCATION_FRESHNESS_CHECK_MS = 15_000;
const SESSION_TICK_MS = 1_000;
const RECOVERY_BACKOFF_BASE_MS = 15_000;
const RECOVERY_BACKOFF_MAX_MS = 120_000;

export type LiveUserPosition = GeoPoint & {
  accuracy: number;
};

export type WalkingSessionStats = {
  elapsedMs: number;
  distanceMeters: number;
  elapsedLabel: string;
};

function toLivePosition(position: GeolocationPosition): LiveUserPosition {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: Math.max(position.coords.accuracy, 0),
  };
}

export function useWalkingMode() {
  const [isWalkingModeEnabled, setIsWalkingModeEnabled] = useState(false);
  const [livePosition, setLivePosition] = useState<LiveUserPosition | null>(
    null,
  );
  const [isFollowModeEnabled, setIsFollowModeEnabled] = useState(false);
  const [locationFreshnessTick, setLocationFreshnessTick] = useState(0);
  const [sessionStats, setSessionStats] = useState<WalkingSessionStats>({
    elapsedMs: 0,
    distanceMeters: 0,
    elapsedLabel: formatWalkingElapsed(0),
  });

  const watchIdRef = useRef<GeolocationWatchId | null>(null);
  const sessionRef = useRef(0);
  const lastLocationAtRef = useRef(0);
  const isWalkingModeEnabledRef = useRef(false);
  const sessionStartAtRef = useRef<number | null>(null);
  const lastRawPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const walkedMetersRef = useRef(0);
  const recoveryInFlightRef = useRef(false);
  const recoveryFailureCountRef = useRef(0);
  const nextRecoveryAllowedAtRef = useRef(0);
  const attemptGpsRecoveryRef = useRef<() => void>(() => {});

  const clearRecoveryBackoff = useCallback(() => {
    recoveryFailureCountRef.current = 0;
    nextRecoveryAllowedAtRef.current = 0;
  }, []);

  const scheduleRecoveryBackoff = useCallback(() => {
    recoveryFailureCountRef.current += 1;
    if (recoveryFailureCountRef.current <= 1) {
      return;
    }

    const delay = Math.min(
      RECOVERY_BACKOFF_BASE_MS *
        (recoveryFailureCountRef.current - 1),
      RECOVERY_BACKOFF_MAX_MS,
    );
    nextRecoveryAllowedAtRef.current = Date.now() + delay;
  }, []);

  const releaseRecoveryLock = useCallback(() => {
    recoveryInFlightRef.current = false;
  }, []);

  const isRecoveryBackoffActive = useCallback(() => {
    return Date.now() < nextRecoveryAllowedAtRef.current;
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current == null) return;
    browserClearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  const resetSessionStats = useCallback(() => {
    sessionStartAtRef.current = null;
    lastRawPositionRef.current = null;
    walkedMetersRef.current = 0;
    setSessionStats({
      elapsedMs: 0,
      distanceMeters: 0,
      elapsedLabel: formatWalkingElapsed(0),
    });
  }, []);

  const applyPositionUpdate = useCallback((position: GeolocationPosition) => {
    lastLocationAtRef.current = Date.now();
    const live = toLivePosition(position);
    setLivePosition(live);

    const accumulated = accumulateWalkedMeters(
      lastRawPositionRef.current,
      { lat: live.lat, lng: live.lng },
      walkedMetersRef.current,
      live.accuracy,
    );
    lastRawPositionRef.current = accumulated.last;
    walkedMetersRef.current = accumulated.totalMeters;
  }, []);

  const startWatch = useCallback(
    (session: number) => {
      if (!isBrowserGeolocationAvailable()) {
        releaseRecoveryLock();
        return;
      }

      clearWatch();
      const watchId = browserWatchPosition(
        (update) => {
          if (session !== sessionRef.current) return;
          applyPositionUpdate(update);
        },
        () => {
          if (session !== sessionRef.current) return;
          clearWatch();
          setLivePosition(null);
          lastLocationAtRef.current = 0;
          scheduleRecoveryBackoff();
          if (!isRecoveryBackoffActive()) {
            attemptGpsRecoveryRef.current();
          }
        },
        WALKING_WATCH_OPTIONS,
      );

      watchIdRef.current = watchId;
      releaseRecoveryLock();
    },
    [
      applyPositionUpdate,
      clearWatch,
      isRecoveryBackoffActive,
      releaseRecoveryLock,
      scheduleRecoveryBackoff,
    ],
  );

  const attemptGpsRecovery = useCallback(() => {
    if (!isWalkingModeEnabledRef.current) return;
    if (watchIdRef.current != null) return;
    if (recoveryInFlightRef.current) return;
    if (isRecoveryBackoffActive()) return;
    if (!isDocumentVisible()) return;
    if (!isBrowserGeolocationAvailable()) return;

    const session = sessionRef.current;
    recoveryInFlightRef.current = true;

    browserGetCurrentPosition(
      (position) => {
        if (session !== sessionRef.current) {
          releaseRecoveryLock();
          return;
        }
        clearRecoveryBackoff();
        applyPositionUpdate(position);
        startWatch(session);
      },
      () => {
        scheduleRecoveryBackoff();
        releaseRecoveryLock();
      },
      WALKING_GEO_OPTIONS,
    );
  }, [
    applyPositionUpdate,
    clearRecoveryBackoff,
    isRecoveryBackoffActive,
    releaseRecoveryLock,
    scheduleRecoveryBackoff,
    startWatch,
  ]);

  useEffect(() => {
    attemptGpsRecoveryRef.current = attemptGpsRecovery;
  }, [attemptGpsRecovery]);

  const disableFollowMode = useCallback(() => {
    setIsFollowModeEnabled(false);
  }, []);

  const enableFollowMode = useCallback(() => {
    setIsFollowModeEnabled(true);
  }, []);

  const stopWalkingMode = useCallback(() => {
    sessionRef.current += 1;
    clearWatch();
    releaseRecoveryLock();
    clearRecoveryBackoff();
    lastLocationAtRef.current = 0;
    if (isWalkingModeEnabledRef.current) {
      track("walking_mode_disabled");
    }
    isWalkingModeEnabledRef.current = false;
    setIsWalkingModeEnabled(false);
    setIsFollowModeEnabled(false);
    setLivePosition(null);
    resetSessionStats();
  }, [clearRecoveryBackoff, clearWatch, releaseRecoveryLock, resetSessionStats]);

  const startWalkingMode = useCallback(() => {
    if (!isBrowserGeolocationAvailable()) return;
    if (recoveryInFlightRef.current) return;

    const session = sessionRef.current + 1;
    sessionRef.current = session;
    isWalkingModeEnabledRef.current = true;
    sessionStartAtRef.current = Date.now();
    lastRawPositionRef.current = null;
    walkedMetersRef.current = 0;
    clearRecoveryBackoff();
    setIsWalkingModeEnabled(true);
    setIsFollowModeEnabled(true);
    setSessionStats({
      elapsedMs: 0,
      distanceMeters: 0,
      elapsedLabel: formatWalkingElapsed(0),
    });
    track("walking_mode_enabled");

    recoveryInFlightRef.current = true;

    browserGetCurrentPosition(
      (position) => {
        if (session !== sessionRef.current) {
          releaseRecoveryLock();
          return;
        }
        clearRecoveryBackoff();
        applyPositionUpdate(position);
        startWatch(session);
      },
      () => {
        releaseRecoveryLock();
        if (session !== sessionRef.current) return;
        stopWalkingMode();
      },
      WALKING_GEO_OPTIONS,
    );
  }, [
    applyPositionUpdate,
    clearRecoveryBackoff,
    releaseRecoveryLock,
    startWatch,
    stopWalkingMode,
  ]);

  const hasActiveUserLocation =
    isWalkingModeEnabled &&
    livePosition != null &&
    Date.now() - lastLocationAtRef.current < STALE_LOCATION_MS;

  useEffect(() => {
    if (!isWalkingModeEnabled) return;

    const intervalId = window.setInterval(() => {
      setLocationFreshnessTick((tick) => tick + 1);
      if (watchIdRef.current == null) {
        attemptGpsRecovery();
      }
    }, LOCATION_FRESHNESS_CHECK_MS);

    return () => window.clearInterval(intervalId);
  }, [isWalkingModeEnabled, attemptGpsRecovery]);

  useEffect(() => {
    if (!isWalkingModeEnabled || sessionStartAtRef.current == null) return;

    const intervalId = window.setInterval(() => {
      const elapsedMs = Date.now() - sessionStartAtRef.current!;
      setSessionStats({
        elapsedMs,
        distanceMeters: walkedMetersRef.current,
        elapsedLabel: formatWalkingElapsed(elapsedMs),
      });
    }, SESSION_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isWalkingModeEnabled]);

  useEffect(() => {
    if (!isWalkingModeEnabled || !livePosition) return;

    setSessionStats((previous) => ({
      ...previous,
      distanceMeters: walkedMetersRef.current,
    }));
  }, [isWalkingModeEnabled, livePosition]);

  useEffect(() => {
    if (!isWalkingModeEnabled) return;
    if (lastLocationAtRef.current === 0) return;

    const isStale =
      Date.now() - lastLocationAtRef.current >= STALE_LOCATION_MS;
    if (!isStale) return;

    clearWatch();
    setLivePosition(null);
    lastLocationAtRef.current = 0;
    attemptGpsRecovery();
  }, [
    isWalkingModeEnabled,
    livePosition,
    locationFreshnessTick,
    clearWatch,
    attemptGpsRecovery,
  ]);

  useEffect(() => {
    if (!isWalkingModeEnabled) return;

    return onDocumentVisibilityChange(() => {
      if (!isDocumentVisible()) return;

      setLocationFreshnessTick((tick) => tick + 1);

      if (watchIdRef.current != null) return;

      attemptGpsRecovery();
    });
  }, [isWalkingModeEnabled, attemptGpsRecovery]);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      clearWatch();
      releaseRecoveryLock();
      clearRecoveryBackoff();
    };
  }, [clearRecoveryBackoff, clearWatch, releaseRecoveryLock]);

  return {
    isWalkingModeEnabled,
    livePosition,
    hasActiveUserLocation,
    isFollowModeEnabled,
    sessionStats,
    startWalkingMode,
    stopWalkingMode,
    enableFollowMode,
    disableFollowMode,
  };
}

export type UseWalkingModeResult = ReturnType<typeof useWalkingMode>;

/**
 * Single browser entry point for navigator.geolocation.
 * Capacitor/native apps should replace this module; Walking Mode stays unchanged.
 */

export const WALKING_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10_000,
  timeout: 15_000,
};

/** Continuous watch — prefer fresh fixes while walking mode is active. */
export const WALKING_WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15_000,
};

export type GeolocationWatchId = number;

export function isBrowserGeolocationAvailable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

export function browserGetCurrentPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError: () => void,
  options: PositionOptions = WALKING_GEO_OPTIONS,
): void {
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
}

export function browserWatchPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError: () => void,
  options: PositionOptions = WALKING_GEO_OPTIONS,
): GeolocationWatchId | null {
  if (!isBrowserGeolocationAvailable()) return null;
  return navigator.geolocation.watchPosition(onSuccess, onError, options);
}

export function browserClearWatch(watchId: GeolocationWatchId): void {
  if (!isBrowserGeolocationAvailable()) return;
  navigator.geolocation.clearWatch(watchId);
}

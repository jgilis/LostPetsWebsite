/**
 * Single browser entry point for navigator.geolocation.
 * Capacitor/native apps should replace this module; Walking Mode stays unchanged.
 */

export const WALKING_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 60_000,
  timeout: 25_000,
};

/**
 * Continuous watch. Do not set `timeout` — Android Chrome treats a watch
 * timeout as a failure and can stop delivering fixes.
 */
export const WALKING_WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5_000,
};

export type GeolocationWatchId = number;

export function isBrowserGeolocationAvailable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

export function isGeolocationPermissionDenied(
  error?: GeolocationPositionError | null,
): boolean {
  return error?.code === 1;
}

export function browserGetCurrentPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error?: GeolocationPositionError) => void,
  options: PositionOptions = WALKING_GEO_OPTIONS,
): void {
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
}

export function browserWatchPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error?: GeolocationPositionError) => void,
  options: PositionOptions = WALKING_GEO_OPTIONS,
): GeolocationWatchId | null {
  if (!isBrowserGeolocationAvailable()) return null;
  return navigator.geolocation.watchPosition(onSuccess, onError, options);
}

export function browserClearWatch(watchId: GeolocationWatchId): void {
  if (!isBrowserGeolocationAvailable()) return;
  navigator.geolocation.clearWatch(watchId);
}

import { LOCATION_COORDINATE_DECIMALS } from "./constants";

export function geocodeCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(LOCATION_COORDINATE_DECIMALS)},${lng.toFixed(LOCATION_COORDINATE_DECIMALS)}`;
}

const store = new Map<string, string>();

export function get(key: string): string | undefined {
  return store.get(key);
}

export function set(key: string, value: string): void {
  store.set(key, value);
}

export function has(key: string): boolean {
  return store.has(key);
}

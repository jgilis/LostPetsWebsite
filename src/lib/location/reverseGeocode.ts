import * as geocodeCache from "./geocodeCache";
import { enqueueReverseGeocodeRequest } from "./reverseGeocodeQueue";

const CACHE_STORAGE_PREFIX = "lost_pets_geocode:";
export const NOMINATIM_FALLBACK = "Near Mechelen";
const NOMINATIM_USER_AGENT =
  "LostPetsMap-Mechelen/1.0 (contact: lostpetsbelgium@gmail.com)";

const COARSE_FIELDS = [
  "neighbourhood",
  "suburb",
  "village",
  "town",
  "road",
  "park",
] as const;

const inFlight = new Map<string, Promise<string>>();

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${CACHE_STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CACHE_STORAGE_PREFIX}${key}`, value);
  } catch {
    // ignore quota / privacy errors
  }
}

function looksLikeExactAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^\d+\s/.test(trimmed)) return true;
  if (
    /\b\d{1,5}[a-z]?\b/i.test(trimmed) &&
    /\b(street|straat|rue|laan|weg)\b/i.test(trimmed)
  ) {
    return true;
  }
  return false;
}

function pickCoarseName(address: Record<string, unknown>): string | null {
  for (const field of COARSE_FIELDS) {
    const raw = address[field];
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value || looksLikeExactAddress(value)) continue;
    return value;
  }
  return null;
}

function toLabel(name: string | null): string {
  if (!name) return NOMINATIM_FALLBACK;
  return `Near ${name}`;
}

function cacheAndReturn(key: string, value: string): string {
  geocodeCache.set(key, value);
  writeStorage(key, value);
  return value;
}

async function fetchFromNominatim(
  lat: number,
  lng: number,
  key: string,
): Promise<string> {
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  let result = NOMINATIM_FALLBACK;

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": NOMINATIM_USER_AGENT,
        },
      },
    );

    if (response.status === 429) {
      return cacheAndReturn(key, NOMINATIM_FALLBACK);
    }

    if (response.ok) {
      const data = (await response.json()) as {
        address?: Record<string, unknown>;
      };
      const address = data.address;
      if (address) {
        result = toLabel(pickCoarseName(address));
      }
    }
  } catch {
    result = NOMINATIM_FALLBACK;
  }

  return cacheAndReturn(key, result);
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const key = geocodeCache.geocodeCacheKey(lat, lng);

  const memoryHit = geocodeCache.get(key);
  if (memoryHit) return memoryHit;

  const stored = readStorage(key);
  if (stored) {
    geocodeCache.set(key, stored);
    return stored;
  }

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = enqueueReverseGeocodeRequest(() =>
    fetchFromNominatim(lat, lng, key),
  ).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
}

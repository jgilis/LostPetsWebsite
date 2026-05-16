/** Usual Mechelen service area for reports and sightings (not the wider map viewport). */
export const MECHELEN_AREA_BOUNDS = {
  latMin: 51.0,
  latMax: 51.1,
  lngMin: 4.4,
  lngMax: 4.5,
} as const;

export function isOutOfMechelen(lat: number, lng: number): boolean {
  return (
    lat < MECHELEN_AREA_BOUNDS.latMin ||
    lat > MECHELEN_AREA_BOUNDS.latMax ||
    lng < MECHELEN_AREA_BOUNDS.lngMin ||
    lng > MECHELEN_AREA_BOUNDS.lngMax
  );
}

export function isReportOutOfMechelen(
  latitude?: number | string | null,
  longitude?: number | string | null,
): boolean {
  if (latitude == null || longitude == null) return false;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  return isOutOfMechelen(lat, lng);
}

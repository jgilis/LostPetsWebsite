import { getDistanceMeters } from "./haversine";

export type GeoPoint = {
  lat: number;
  lng: number;
};

export function isWithinRadius(
  a: GeoPoint,
  b: GeoPoint,
  radiusMeters: number,
): boolean {
  return getDistanceMeters(a.lat, a.lng, b.lat, b.lng) <= radiusMeters;
}

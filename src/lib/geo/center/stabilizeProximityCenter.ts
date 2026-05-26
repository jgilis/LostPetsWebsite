import { LOCATION_COORDINATE_DECIMALS } from "@/src/lib/location/constants";
import type { ProximityCenter } from "./ProximityCenterProvider";

export function stabilizeProximityCenter(
  center: ProximityCenter,
): ProximityCenter {
  return {
    lat: Number(center.lat.toFixed(LOCATION_COORDINATE_DECIMALS)),
    lng: Number(center.lng.toFixed(LOCATION_COORDINATE_DECIMALS)),
  };
}

export function areProximityCentersEqual(
  a: ProximityCenter | null,
  b: ProximityCenter | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  const stabilizedA = stabilizeProximityCenter(a);
  const stabilizedB = stabilizeProximityCenter(b);

  return (
    stabilizedA.lat === stabilizedB.lat && stabilizedA.lng === stabilizedB.lng
  );
}

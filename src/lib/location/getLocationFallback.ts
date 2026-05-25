import {
  LOCATION_COORDINATE_DECIMALS,
  MECHELEN_FALLBACK_REGION,
} from "./constants";
import type { LocationLabel } from "./types";

export function getLocationFallback(
  latitude: number,
  longitude: number,
): LocationLabel {
  return {
    primary: `Near ${latitude.toFixed(LOCATION_COORDINATE_DECIMALS)}, ${longitude.toFixed(LOCATION_COORDINATE_DECIMALS)}`,
    secondary: MECHELEN_FALLBACK_REGION,
    source: "fallback",
  };
}

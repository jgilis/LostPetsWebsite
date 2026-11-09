import { LOCATION_OFFSET_SPAN } from "./reportValidation";

/**
 * Privacy offset applied by verify-captcha-v2, not by the report form.
 * The legacy verify-captcha endpoint must not apply this offset: the
 * production frontend still offsets in the browser.
 * Keep LOCATION_OFFSET_SPAN in sync with verify-captcha-v2.
 */
export function applyLocationOffset(lat: number, lng: number) {
  const latOffset = (Math.random() - 0.5) * LOCATION_OFFSET_SPAN;
  const lngOffset = (Math.random() - 0.5) * LOCATION_OFFSET_SPAN;

  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset,
  };
}

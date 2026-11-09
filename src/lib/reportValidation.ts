export const REPORT_TYPES = ["lost", "found"] as const;
export const ANIMAL_TYPES = ["dog", "cat", "bird", "rodent", "other"] as const;

export const MIN_DESCRIPTION_LENGTH = 5;
export const MAX_DESCRIPTION_LENGTH = 4000;
export const MAX_ANIMAL_NAME_LENGTH = 80;

/** Must stay in sync with verify-captcha-v2 LOCATION_OFFSET_SPAN. */
export const LOCATION_OFFSET_SPAN = 0.0005;

/** Original upload cap; matches the report-photos bucket file_size_limit. */
export const MAX_SOURCE_PHOTO_BYTES = 5_242_880;

/** Re-encoded JPEG cap sent to verify-captcha-v2. */
export const MAX_ENCODED_PHOTO_BYTES = 1_500_000;
export const MAX_PHOTO_DIMENSION = 1600;

export type ReportType = (typeof REPORT_TYPES)[number];
export type AnimalType = (typeof ANIMAL_TYPES)[number];

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

export function isAnimalType(value: string): value is AnimalType {
  return (ANIMAL_TYPES as readonly string[]).includes(value);
}

export function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidLatitude(value: number): boolean {
  return value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return value >= -180 && value <= 180;
}

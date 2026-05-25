import type { Report } from "@/src/lib/reports";

export type ProximityEvent = {
  report: Report;
  distanceMeters: number;
  centerLat: number;
  centerLng: number;
  computedAt?: number;
};

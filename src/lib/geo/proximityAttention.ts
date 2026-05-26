import type { ProximityEvent } from "./types";
import { isSeen } from "./proximityMemory";

export const VERY_CLOSE_THRESHOLD_METERS = 75;

export type ProximityAttentionFlags = {
  isVeryClose: boolean;
  isNewNearby: boolean;
  isSeen: boolean;
};

export function isVeryClose(distanceMeters: number): boolean {
  return distanceMeters < VERY_CLOSE_THRESHOLD_METERS;
}

export function isNewNearby(reportId: string): boolean {
  if (!reportId) return false;
  return !isSeen(reportId);
}

export function getAttentionFlags(event: ProximityEvent): ProximityAttentionFlags {
  const seen = isSeen(event.report.id);
  const veryClose = isVeryClose(event.distanceMeters);
  const newNearby = isNewNearby(event.report.id);

  return {
    isVeryClose: veryClose,
    isNewNearby: newNearby,
    isSeen: seen,
  };
}

export type DominantAttention = "very-close" | "new-nearby" | "seen" | "none";

export function getDominantAttention(
  flags: ProximityAttentionFlags,
): DominantAttention {
  if (flags.isVeryClose) return "very-close";
  if (flags.isNewNearby) return "new-nearby";
  if (flags.isSeen) return "seen";
  return "none";
}

import { getDistanceMeters } from "./geo/haversine";
import { supabase } from "./supabase";
import {
  REPORT_PUBLIC_SELECT,
  normalizeReportRow,
  type Report,
  type ReportStatus,
} from "./reports";

export const DUPLICATE_HINT_RADIUS_M = 300;
export const DUPLICATE_HINT_WINDOW_MS = 48 * 60 * 60 * 1000;

export type DuplicateHintCandidate = {
  id: string;
  animal_type: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  date_reported?: string | null;
  created_at?: string | null;
  status?: ReportStatus | string;
};

type HintPoint = {
  animalType: string;
  latitude: number;
  longitude: number;
  excludeId?: string;
  nowMs?: number;
};

function reportedAtMs(candidate: DuplicateHintCandidate): number | null {
  const raw = candidate.date_reported ?? candidate.created_at;
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

export function isPossibleDuplicate(
  candidate: DuplicateHintCandidate,
  point: HintPoint,
): boolean {
  if (candidate.id === point.excludeId) return false;
  if (candidate.status && candidate.status !== "active") return false;
  if (candidate.animal_type !== point.animalType) return false;
  if (candidate.latitude == null || candidate.longitude == null) return false;

  const lat = Number(candidate.latitude);
  const lng = Number(candidate.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  const reportedMs = reportedAtMs(candidate);
  if (reportedMs == null) return false;

  const nowMs = point.nowMs ?? Date.now();
  if (reportedMs > nowMs || nowMs - reportedMs > DUPLICATE_HINT_WINDOW_MS) {
    return false;
  }

  return (
    getDistanceMeters(point.latitude, point.longitude, lat, lng) <=
    DUPLICATE_HINT_RADIUS_M
  );
}

export function findPossibleDuplicates<T extends DuplicateHintCandidate>(
  candidates: T[],
  point: HintPoint,
): T[] {
  return candidates.filter((candidate) => isPossibleDuplicate(candidate, point));
}

export async function fetchPossibleDuplicateReports(point: {
  animalType: string;
  latitude: number;
  longitude: number;
  excludeId?: string;
}): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_PUBLIC_SELECT)
    .eq("status", "active")
    .eq("animal_type", point.animalType);

  if (error) {
    console.error(error);
    return [];
  }

  return findPossibleDuplicates(
    (data ?? []).map((row) => normalizeReportRow(row)),
    point,
  );
}

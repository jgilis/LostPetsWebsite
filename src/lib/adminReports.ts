import type { ReportStatus } from "./reports";

export type AdminReport = {
  id: string;
  type?: "lost" | "found" | string;
  animal_type: string;
  animal_name?: string | null;
  description?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  photo_url?: string | null;
  status: ReportStatus | string;
  date_reported?: string | null;
};

export function formatAdminReportStatus(status: string): string {
  if (status === "removed") return "hidden";
  return status;
}

export function truncateText(text: string, maxLength = 140): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function formatReportLocation(
  latitude?: number | string | null,
  longitude?: number | string | null,
): string | null {
  if (latitude == null || longitude == null) return null;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function formatReportTimestamp(report: AdminReport): string | null {
  const raw = report.date_reported;
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString();
}

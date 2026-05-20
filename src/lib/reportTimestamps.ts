/** Minimal timestamp fields shared by public and admin report shapes. */
export type ReportTimestampFields = {
  date_reported?: string | null;
  created_at?: string | null;
};

/**
 * Primary business timestamp first; falls back to row creation time.
 * Use for display/sort when adopting the dual-timestamp pattern elsewhere.
 */
export function getReportTimestamp(
  report: ReportTimestampFields,
): string | null {
  return report.date_reported ?? report.created_at ?? null;
}

export function formatReportTimestampDisplay(
  report: ReportTimestampFields,
): string | null {
  const raw = getReportTimestamp(report);
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString();
}

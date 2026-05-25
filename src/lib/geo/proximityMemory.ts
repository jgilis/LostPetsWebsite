const seenReportIds = new Set<string>();

export function markSeen(reportId: string): void {
  if (!reportId) return;
  seenReportIds.add(reportId);
}

export function isSeen(reportId: string): boolean {
  if (!reportId) return false;
  return seenReportIds.has(reportId);
}

export function clearSeen(): void {
  seenReportIds.clear();
}

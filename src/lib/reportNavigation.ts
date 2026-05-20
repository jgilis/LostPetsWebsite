export type ReportFromContext = "feed" | "map" | null;

export const FEED_SCROLL_STORAGE_KEY = "lost-pets-feed-scroll";

export function parseReportFrom(
  value: string | string[] | null | undefined,
): ReportFromContext {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "feed" || raw === "map") return raw;
  return null;
}

export function reportDetailHref(
  id: string,
  from: "feed" | "map",
): string {
  return `/report/${id}?from=${from}`;
}

export function reportBackHref(from: ReportFromContext): string {
  if (from === "feed") return "/?tab=feed";
  if (from === "map") return "/?tab=map";
  return "/";
}

export function saveFeedScrollPosition(scrollTop: number): void {
  try {
    sessionStorage.setItem(FEED_SCROLL_STORAGE_KEY, String(scrollTop));
  } catch {
    // sessionStorage unavailable (private mode, quota, etc.)
  }
}

export function readAndClearFeedScrollPosition(): number | null {
  try {
    const raw = sessionStorage.getItem(FEED_SCROLL_STORAGE_KEY);
    sessionStorage.removeItem(FEED_SCROLL_STORAGE_KEY);
    if (!raw) return null;
    const top = Number.parseInt(raw, 10);
    return Number.isFinite(top) && top >= 0 ? top : null;
  } catch {
    return null;
  }
}

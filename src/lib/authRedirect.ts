import { parseReportTask, reportTaskHref } from "./homeDestination";

export const AUTH_RETURN_STORAGE_KEY = "lostpets.authReturnTo.v1";
/** Same window as the report draft: long enough for a magic-link email. */
export const AUTH_RETURN_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Only the Report form may be a magic-link return target from this login. */
export function safeAuthRedirectPath(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value, "https://lostpets.invalid");
  } catch {
    return null;
  }

  if (url.pathname !== "/") return null;
  const tab = url.searchParams.get("tab");
  if (tab !== "report" && tab !== "help") return null;

  const task = parseReportTask(url.searchParams.get("task"));
  return task ? reportTaskHref(task) : "/?tab=report";
}

export function reportLoginHref(task: "lost" | "found"): string {
  return `/login?next=${encodeURIComponent(reportTaskHref(task))}`;
}

export function parseAuthReturnPath(
  raw: string | null,
  now = Date.now(),
): string | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.savedAt !== "number" || !Number.isFinite(record.savedAt)) {
    return null;
  }
  if (
    now - record.savedAt > AUTH_RETURN_MAX_AGE_MS ||
    record.savedAt > now + 60_000
  ) {
    return null;
  }
  if (typeof record.path !== "string") return null;
  return safeAuthRedirectPath(record.path);
}

export function writeAuthReturnPath(raw: string | null | undefined): void {
  const path = safeAuthRedirectPath(raw);
  if (!path) return;
  try {
    localStorage.setItem(
      AUTH_RETURN_STORAGE_KEY,
      JSON.stringify({ path, savedAt: Date.now() }),
    );
  } catch {
    // private mode / quota
  }
}

export function peekAuthReturnPath(now = Date.now()): string | null {
  try {
    return parseAuthReturnPath(
      localStorage.getItem(AUTH_RETURN_STORAGE_KEY),
      now,
    );
  } catch {
    return null;
  }
}

export function clearAuthReturnPath(): void {
  try {
    localStorage.removeItem(AUTH_RETURN_STORAGE_KEY);
  } catch {
    // private mode
  }
}

export function consumeAuthReturnPath(now = Date.now()): string | null {
  const path = peekAuthReturnPath(now);
  if (path) clearAuthReturnPath();
  return path;
}

export function isSameAppPath(left: string, right: string): boolean {
  try {
    const a = new URL(left, "https://lostpets.invalid");
    const b = new URL(right, "https://lostpets.invalid");
    return a.pathname === b.pathname && a.search === b.search;
  } catch {
    return left === right;
  }
}

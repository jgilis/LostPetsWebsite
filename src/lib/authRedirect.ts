import { parseReportTask, reportTaskHref } from "./homeDestination";

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

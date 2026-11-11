export type HomeDestination = "discover" | "activity" | "report";

export function parseHomeDestination(
  tab: string | null,
  focus: string | null,
): HomeDestination {
  if (focus) return "discover";
  if (tab === "activity" || tab === "feed") return "activity";
  if (tab === "help" || tab === "report") return "report";
  return "discover";
}

export function homeDestinationHref(destination: HomeDestination): string {
  if (destination === "activity") return "/?tab=activity";
  if (destination === "report") return "/?tab=report";
  return "/?tab=discover";
}

export function parseReportTask(value: string | null): "lost" | "found" | null {
  if (value === "lost" || value === "found") return value;
  return null;
}

export function reportTaskHref(task: "lost" | "found"): string {
  return `/?tab=report&task=${task}`;
}

export type HomeDestination = "discover" | "activity" | "help";

export function parseHomeDestination(
  tab: string | null,
  focus: string | null,
): HomeDestination {
  if (focus) return "discover";
  if (tab === "activity" || tab === "feed") return "activity";
  if (tab === "help" || tab === "report") return "help";
  return "discover";
}

export function homeDestinationHref(destination: HomeDestination): string {
  if (destination === "activity") return "/?tab=activity";
  if (destination === "help") return "/?tab=help";
  return "/?tab=discover";
}

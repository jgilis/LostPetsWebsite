import type { LocationLabel } from "./types";

export function formatLocationLabel(label: LocationLabel): string {
  if (label.secondary) {
    return `${label.primary}, ${label.secondary}`;
  }

  return label.primary;
}

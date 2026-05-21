import { Report } from "../report/useReports";

export type FeedLifecycleFilter = "active" | "resolved" | "all";

export function filterReports(
  reports: Report[],
  typeFilter: string,
  animalFilter: string,
) {
  return reports.filter((r) => {
    if (r.status !== "active") return false;

    const typeMatch = typeFilter === "all" || r.type === typeFilter;
    const animalMatch =
      animalFilter === "all" || r.animal_type === animalFilter;

    return typeMatch && animalMatch;
  });
}

export function filterFeedReports(
  reports: Report[],
  typeFilter: string,
  animalFilter: string,
  lifecycleFilter: FeedLifecycleFilter,
) {
  return reports.filter((r) => {
    if (
      r.status === "flagged" ||
      r.status === "removed" ||
      r.status === "expired"
    ) {
      return false;
    }

    if (lifecycleFilter === "active" && r.status !== "active") return false;
    if (lifecycleFilter === "resolved" && r.status !== "resolved") {
      return false;
    }
    if (
      lifecycleFilter === "all" &&
      r.status !== "active" &&
      r.status !== "resolved"
    ) {
      return false;
    }

    const typeMatch = typeFilter === "all" || r.type === typeFilter;
    const animalMatch =
      animalFilter === "all" || r.animal_type === animalFilter;

    return typeMatch && animalMatch;
  });
}
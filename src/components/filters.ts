import { Report } from "./useReports";

export function filterReports(
  reports: Report[],
  typeFilter: string,
  animalFilter: string
) {
  return reports.filter((r) => {
    // 🟢 lifecycle rule (core change)
    if (r.status !== "active") return false;

    const typeMatch = typeFilter === "all" || r.type === typeFilter;
    const animalMatch =
      animalFilter === "all" || r.animal_type === animalFilter;

    return typeMatch && animalMatch;
  });
}
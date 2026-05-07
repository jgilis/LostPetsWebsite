"use client";

import type { Report } from "./useReports";
import ReportMarker from "./ReportMarker";

type AnimalType = "dog" | "cat" | "bird" | "rodent" | "other";

type Props = {
  reports: Report[];
  animalColors: Record<AnimalType, string>;
  getIcon: (animal: AnimalType) => any;
};

export default function ReportsLayer({
  reports,
  animalColors,
  getIcon,
}: Props) {
  return (
    <>
      {reports.map((r) => (
        <ReportMarker
          key={r.id}
          report={r}
          icon={getIcon(r.animal_type)}
          color={animalColors[r.animal_type]}
        />
      ))}
    </>
  );
}
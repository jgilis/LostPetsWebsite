"use client";

import ReportMarker from "./ReportMarker";
import ClusterMarker from "./ClusterMarker";
import type { Report } from "../report/useReports";
import { useCurrentUser } from "../../hooks/useCurrentUser";

type Props = {
  items: any[];
  animalColors: Record<string, string>;
  getIcon: (animal: any) => any;
  reportIconOverride?: any;
  index: any;
  map: any;
  onClusterClick: (id: number, lat: number, lng: number) => void;
};

export default function ReportsLayer({
  items,
  animalColors,
  getIcon,
  reportIconOverride,
  index,
  map,
  onClusterClick,
}: Props) {
  const { isAdmin } = useCurrentUser();

  return items.map((item) => {
    if (!item?.geometry) return null;

    const [lng, lat] = item.geometry.coordinates;

    if (item.properties?.cluster) {
      return (
        <ClusterMarker
          key={`cluster-${item.id}`}
          cluster={item}
          onClick={() => {
            onClusterClick(
              item.properties.cluster_id,
              lat,
              lng
            );
          }}
        />
      );
    }

    const report: Report | undefined =
      item.properties?.report;

    if (
      !report ||
      report.latitude == null ||
      report.longitude == null
    ) {
      return null;
    }

    const icon = reportIconOverride ?? getIcon(report.animal_type);
    const color = animalColors[report.animal_type];

    return (
      <ReportMarker
        key={`report-${report.id}`}
        report={report}
        icon={icon}
        color={color}
        isAdmin={isAdmin}
      />
    );
  });
}
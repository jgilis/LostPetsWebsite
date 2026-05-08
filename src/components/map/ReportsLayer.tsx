"use client";

import ReportMarker from "./ReportMarker";
import ClusterMarker from "./ClusterMarker";
import type { Report } from "../report/useReports";

type Props = {
  items: any[];
  animalColors: Record<string, string>;
  getIcon: (animal: any) => any;
  index: any;
  map: any;
  onClusterClick: (id: number, lat: number, lng: number) => void;
  setSelectedReport: (id: string) => void;
};

export default function ReportsLayer({
  items,
  animalColors,
  getIcon,
  index,
  map,
  onClusterClick,
  setSelectedReport
}: Props) {
  return items.map((item) => {
    if (!item?.geometry) return null;

    const [lng, lat] = item.geometry.coordinates;

    // 🔵 CLUSTER
    if (item.properties?.cluster) {
      return (
        <ClusterMarker
          key={`cluster-${item.id}`}
          cluster={item}
          onClick={() => {
            onClusterClick(item.properties.cluster_id, lat, lng);
          }}
        />
      );
    }

    // 🟢 SINGLE REPORT
    const report: Report | undefined = item.properties?.report;

    if (!report || report.latitude == null || report.longitude == null) {
      return null;
    }

    return (
      <ReportMarker
        key={`report-${report.id}`}
        report={report}
        icon={getIcon(report.animal_type)}
        color={animalColors[report.animal_type]}
        setSelectedReport={setSelectedReport}
      />
    );
  });
}
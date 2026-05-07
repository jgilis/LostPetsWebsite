"use client";

import { Marker, CircleMarker, Popup } from "react-leaflet";
import type { Report } from "./useReports";
import ReportPopup from "./ReportPopup";

type AnimalType = "dog" | "cat" | "bird" | "rodent" | "other";

type Props = {
  report: Report;
  icon?: any;
  color: string;
};

export default function ReportMarker({
  report,
  icon,
  color,
}: Props) {
  if (report.type === "found") {
    return (
      <CircleMarker
        center={[report.latitude, report.longitude]}
        radius={6}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Popup>
          <ReportPopup report={report} />
        </Popup>
      </CircleMarker>
    );
  }

  return (
    <Marker
      position={[report.latitude, report.longitude]}
      icon={icon}
    >
      <Popup>
        <ReportPopup report={report} />
      </Popup>
    </Marker>
  );
}
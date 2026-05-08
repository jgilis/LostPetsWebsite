"use client";

import { Marker, CircleMarker } from "react-leaflet";
import type { Report } from "../report/useReports";

type Props = {
  report: Report;
  icon?: any;
  color: string;
  setSelectedReport: (id: string) => void;
};

export default function ReportMarker({
  report,
  icon,
  color,
  setSelectedReport,
}: Props) {
  const handleClick = () => {
    if (!report?.id) return;
    setSelectedReport(report.id);
  };

  const eventHandlers = {
    click: handleClick,
  };

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
        eventHandlers={eventHandlers}
      />
    );
  }

  return (
    <Marker
      position={[report.latitude, report.longitude]}
      icon={icon}
      eventHandlers={eventHandlers}
    />
  );
}
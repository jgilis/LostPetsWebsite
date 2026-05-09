"use client";

import {
  Marker,
  CircleMarker,
  Popup,
} from "react-leaflet";

import type { Report } from "../report/useReports";
import ReportPopup from "./ReportPopup";

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
  const popupProps = {
    autoPan: false,
    closeButton: true,
    closeOnClick: false,
    autoClose: false,
    closeOnEscapeKey: true,
  };

  if (report.type === "found") {
    return (
      <CircleMarker
        center={[report.latitude, report.longitude]}
        radius={8}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Popup {...popupProps}>
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
      <Popup {...popupProps}>
        <ReportPopup report={report} />
      </Popup>
    </Marker>
  );
}
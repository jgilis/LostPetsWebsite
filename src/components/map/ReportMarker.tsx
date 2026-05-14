"use client";

import {
  Marker,
  CircleMarker,
  Popup,
} from "react-leaflet";

import type { Report } from "../report/useReports";
import ReportPopup from "./ReportPopup";
import { memo } from "react";

type Props = {
  report: Report;
  icon?: any;
  color: string;
  currentUserId?: string | null;
  isAdmin?: boolean;
};

export default memo(function ReportMarker({
  report,
  icon,
  color,
  currentUserId,
  isAdmin,
}: Props) {
  const popupProps = {
    autoPan: false,
    closeButton: true,
    closeOnClick: false,
    autoClose: false,
    closeOnEscapeKey: true,
  };
  
  const isOwner = currentUserId === report.owner_user_id;
  const canSeeExactSightings = isAdmin || isOwner;

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
          <ReportPopup
            report={report}
            canSeeExactSightings={canSeeExactSightings}
          />
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
        <ReportPopup
          report={report}
          canSeeExactSightings={canSeeExactSightings}
        />
      </Popup>
    </Marker>
  );
})
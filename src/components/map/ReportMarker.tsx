"use client";

import {
  Marker,
  CircleMarker,
  Popup,
} from "react-leaflet";

import type { Report } from "../report/useReports";
import ReportPopup from "./ReportPopup";
import { memo } from "react";
import { getOwnerToken } from "../../lib/owner";
import { isOwner } from "../../lib/permissions";

type Props = {
  report: Report;
  icon?: any;
  color: string;
  isAdmin?: boolean;
};

export default memo(function ReportMarker({
  report,
  icon,
  color,
  isAdmin,
}: Props) {
  const popupProps = {
    autoPan: false,
    closeButton: true,
    closeOnClick: false,
    autoClose: false,
    closeOnEscapeKey: true,
  };
  
  const canSeeExactSightings =
    isAdmin ||
    isOwner(getOwnerToken(), report.owner_user_id ?? null);

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
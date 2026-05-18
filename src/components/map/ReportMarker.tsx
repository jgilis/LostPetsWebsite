"use client";

import {
  Marker,
  CircleMarker,
  Popup,
} from "react-leaflet";

import type { Report } from "../report/useReports";
import ReportPopup from "./ReportPopup";
import { memo } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";

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
  const { userId } = useCurrentUser();

  const popupProps = {
    className: "report-popup",
    maxWidth: 280,
    autoPan: true,
    keepInView: true,
    offset: [0, 14] as [number, number],
    autoPanPaddingTopLeft: [24, 24] as [number, number],
    autoPanPaddingBottomRight: [24, 24] as [number, number],
    closeButton: true,
    closeOnClick: false,
    autoClose: false,
    closeOnEscapeKey: true,
  };
  
  const isReportOwner =
    !!userId &&
    !!report.owner_user_id &&
    userId === report.owner_user_id;

  const canSeeExactSightings = isAdmin || isReportOwner;

  if (report.type === "found") {
    const center: [number, number] = [report.latitude, report.longitude];

    return (
      <>
        <CircleMarker
          center={center}
          radius={14}
          pathOptions={{
            fillOpacity: 0,
            opacity: 0,
            weight: 0,
            stroke: false,
          }}
        >
          <Popup {...popupProps}>
            <ReportPopup
              report={report}
              canSeeExactSightings={canSeeExactSightings}
              isReportOwner={isReportOwner}
            />
          </Popup>
        </CircleMarker>
        <CircleMarker
          center={center}
          radius={8}
          interactive={false}
          pathOptions={{
            color,
            fillColor: color,
            fillOpacity: 0.9,
            weight: 2,
            interactive: false,
          }}
        />
      </>
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
          isReportOwner={isReportOwner}
        />
      </Popup>
    </Marker>
  );
})
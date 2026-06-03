"use client";

import {
  Marker,
  CircleMarker,
  Popup,
} from "react-leaflet";
import type { Layer } from "leaflet";

import type { Report } from "../report/useReports";
import ReportPopup from "./ReportPopup";
import { memo, useCallback, useEffect, useRef } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { isOwner } from "../../lib/permissions";

type Props = {
  report: Report;
  icon?: any;
  color: string;
  isAdmin?: boolean;
  openPopupToken?: number;
};

function useOpenPopupFromFocus(
  openPopupToken: number,
  markerRef: React.RefObject<Layer | null>,
) {
  useEffect(() => {
    if (!openPopupToken) return;

    const timer = window.setTimeout(() => {
      const layer = markerRef.current as
        | (Layer & { openPopup?: () => void; getElement?: () => HTMLElement | null })
        | null;
      if (!layer?.getElement?.()?.isConnected) return;
      layer.openPopup?.();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [openPopupToken, markerRef]);
}

export default memo(function ReportMarker({
  report,
  icon,
  color,
  isAdmin,
  openPopupToken = 0,
}: Props) {
  const layerRef = useRef<Layer | null>(null);
  const setLayerRef = useCallback((instance: Layer | null) => {
    layerRef.current = instance;
  }, []);
  useOpenPopupFromFocus(openPopupToken, layerRef);
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
  
  const isReportOwner = isOwner(userId, report.owner_user_id);

  const canSeeExactSightings = isAdmin || isReportOwner;

  if (report.type === "found") {
    const center: [number, number] = [report.latitude, report.longitude];

    return (
      <>
        <CircleMarker
          ref={setLayerRef}
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
      ref={setLayerRef}
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
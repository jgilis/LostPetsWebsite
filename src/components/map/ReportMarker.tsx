"use client";

import {
  Marker,
  CircleMarker,
  Popup,
} from "react-leaflet";
import type { DivIcon, Layer } from "leaflet";

import type { Report } from "../report/useReports";
import ReportPopup from "./ReportPopup";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { isOwner } from "../../lib/permissions";

function createFoundIcon(color: string, selected: boolean): DivIcon {
  const L = require("leaflet");
  return new L.DivIcon({
    className: `discover-found-marker${selected ? " is-selected" : ""}`,
    html: `<span class="discover-found-dot" style="background:${color}"></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -12],
  });
}

type Props = {
  report: Report;
  icon?: any;
  color: string;
  isAdmin?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  enablePopup?: boolean;
  openPopupToken?: number;
};

function useOpenPopupFromFocus(
  openPopupToken: number,
  markerRef: React.RefObject<Layer | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !openPopupToken) return;

    const timer = window.setTimeout(() => {
      const layer = markerRef.current as
        | (Layer & { openPopup?: () => void; getElement?: () => HTMLElement | null })
        | null;
      if (!layer?.getElement?.()?.isConnected) return;
      layer.openPopup?.();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [enabled, openPopupToken, markerRef]);
}

export default memo(function ReportMarker({
  report,
  icon,
  color,
  isAdmin,
  selected = false,
  onSelect,
  enablePopup = false,
  openPopupToken = 0,
}: Props) {
  const layerRef = useRef<Layer | null>(null);
  const setLayerRef = useCallback((instance: Layer | null) => {
    layerRef.current = instance;
  }, []);
  useOpenPopupFromFocus(openPopupToken, layerRef, enablePopup);
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
  const handleSelect = useCallback(() => {
    onSelect?.(report.id);
  }, [onSelect, report.id]);
  const center: [number, number] = [report.latitude, report.longitude];
  const selectedRing = selected ? (
    <CircleMarker
      center={center}
      radius={18}
      interactive={false}
      pathOptions={{
        color: "#ffffff",
        fillOpacity: 0,
        opacity: 0.95,
        weight: 3,
      }}
    />
  ) : null;
  const popup = enablePopup ? (
    <Popup {...popupProps}>
      <ReportPopup
        report={report}
        canSeeExactSightings={canSeeExactSightings}
      />
    </Popup>
  ) : null;

  const foundIcon = useMemo(
    () => createFoundIcon(color, selected),
    [color, selected],
  );

  if (report.type === "found") {
    return (
      <Marker
        ref={setLayerRef}
        position={center}
        icon={foundIcon}
        zIndexOffset={1000}
        title={`Found ${report.animal_type}`}
        alt={`Found ${report.animal_type}`}
        eventHandlers={{ click: handleSelect }}
      >
        {popup}
      </Marker>
    );
  }

  return (
    <>
      {selectedRing}
      <Marker
        ref={setLayerRef}
        position={center}
        icon={icon}
        eventHandlers={{ click: handleSelect }}
      >
        {popup}
      </Marker>
    </>
  );
})

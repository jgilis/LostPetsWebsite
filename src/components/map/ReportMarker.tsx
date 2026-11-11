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
import { canSeeExactSightings } from "../../lib/permissions";
import { createSpeciesMarkerIcon } from "@/src/lib/map/speciesMarkerIcon";

function createFoundIcon(animalType: string, selected: boolean): DivIcon {
  // Hittable found target: discover-found-marker DivIcon iconSize: [44, 44]
  return createSpeciesMarkerIcon(animalType, "found", selected);
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
  
  const showExactSightings = canSeeExactSightings(
    userId,
    isAdmin ?? false,
    report.owner_user_id,
  );
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
        color: "#fffbf5",
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
        canSeeExactSightings={showExactSightings}
      />
    </Popup>
  ) : null;

  const foundIcon = useMemo(
    () => createFoundIcon(report.animal_type, selected),
    [report.animal_type, selected],
  );
  const lostIcon = useMemo(
    () => icon ?? createSpeciesMarkerIcon(report.animal_type, "lost", selected),
    [icon, report.animal_type, selected],
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
        icon={lostIcon}
        eventHandlers={{ click: handleSelect }}
      >
        {popup}
      </Marker>
    </>
  );
});

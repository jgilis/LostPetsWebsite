"use client";

import { useEffect, useRef } from "react";
import { Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import type { UseWalkingModeResult } from "@/src/hooks/useWalkingMode";

type LivePosition = NonNullable<UseWalkingModeResult["livePosition"]>;

type WalkingModeMapLayersProps = {
  livePosition: LivePosition;
  isFollowModeEnabled: boolean;
  onManualPan: () => void;
};

const FOLLOW_VIEW_PADDING_RATIO = 0.2;

function isUserInsidePaddedView(
  map: ReturnType<typeof useMap>,
  lat: number,
  lng: number,
): boolean {
  const bounds = map.getBounds();
  if (!bounds) return true;

  const latSpan = bounds.getNorth() - bounds.getSouth();
  const lngSpan = bounds.getEast() - bounds.getWest();
  const padLat = latSpan * FOLLOW_VIEW_PADDING_RATIO;
  const padLng = lngSpan * FOLLOW_VIEW_PADDING_RATIO;

  return (
    lat >= bounds.getSouth() + padLat &&
    lat <= bounds.getNorth() - padLat &&
    lng >= bounds.getWest() + padLng &&
    lng <= bounds.getEast() - padLng
  );
}

function WalkingMapFollow({
  livePosition,
  isFollowModeEnabled,
}: {
  livePosition: LivePosition;
  isFollowModeEnabled: boolean;
}) {
  const map = useMap();
  const skipNextFollowRef = useRef(false);

  useEffect(() => {
    const onRecenter = () => {
      skipNextFollowRef.current = true;
    };
    window.addEventListener("walking-map-recenter", onRecenter);
    return () => window.removeEventListener("walking-map-recenter", onRecenter);
  }, []);

  useEffect(() => {
    if (!isFollowModeEnabled) return;

    if (skipNextFollowRef.current) {
      skipNextFollowRef.current = false;
      map.panTo([livePosition.lat, livePosition.lng], { animate: true });
      return;
    }

    if (isUserInsidePaddedView(map, livePosition.lat, livePosition.lng)) {
      return;
    }

    map.panTo([livePosition.lat, livePosition.lng], { animate: true });
  }, [
    map,
    isFollowModeEnabled,
    livePosition.lat,
    livePosition.lng,
  ]);

  return null;
}

function WalkingFollowDragHandler({ onManualPan }: { onManualPan: () => void }) {
  useMapEvents({
    dragstart() {
      onManualPan();
    },
  });

  return null;
}

export default function WalkingModeMapLayers({
  livePosition,
  isFollowModeEnabled,
  onManualPan,
}: WalkingModeMapLayersProps) {
  const accuracy = Math.max(livePosition.accuracy, 8);

  return (
    <>
      <WalkingFollowDragHandler onManualPan={onManualPan} />
      <WalkingMapFollow
        livePosition={livePosition}
        isFollowModeEnabled={isFollowModeEnabled}
      />
      <Circle
        center={[livePosition.lat, livePosition.lng]}
        radius={accuracy}
        pathOptions={{
          color: "#60a5fa",
          fillColor: "#3b82f6",
          fillOpacity: 0.12,
          weight: 1,
        }}
      />
      <CircleMarker
        center={[livePosition.lat, livePosition.lng]}
        radius={9}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#2563eb",
          fillOpacity: 1,
          weight: 3,
        }}
      />
    </>
  );
}

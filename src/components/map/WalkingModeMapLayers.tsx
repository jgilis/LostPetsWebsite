"use client";

import { useEffect } from "react";
import { Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import type { UseWalkingModeResult } from "@/src/hooks/useWalkingMode";

type LivePosition = NonNullable<UseWalkingModeResult["livePosition"]>;

type WalkingModeMapLayersProps = {
  livePosition: LivePosition;
  isFollowModeEnabled: boolean;
  onManualPan: () => void;
};

function WalkingMapFollow({
  livePosition,
  isFollowModeEnabled,
}: {
  livePosition: LivePosition;
  isFollowModeEnabled: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!isFollowModeEnabled) return;

    map.setView([livePosition.lat, livePosition.lng], map.getZoom(), {
      animate: true,
    });
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

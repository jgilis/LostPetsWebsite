"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type Props = {
  onChange: (state: {
    zoom: number;
    bounds: [number, number, number, number];
  }) => void;
};

export default function MapStateWatcher({ onChange }: Props) {
  const map = useMap();
  const lastRef = useRef<any>(null);

  useEffect(() => {
    const update = () => {
      const bounds = map.getBounds();

      const nextState = {
        zoom: map.getZoom(),
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ] as [number, number, number, number],
      };

      const prev = lastRef.current;

      // 🧠 HARD GUARD: prevent infinite loop triggers
      if (
        prev &&
        prev.zoom === nextState.zoom &&
        prev.bounds?.[0] === nextState.bounds[0] &&
        prev.bounds?.[1] === nextState.bounds[1] &&
        prev.bounds?.[2] === nextState.bounds[2] &&
        prev.bounds?.[3] === nextState.bounds[3]
      ) {
        return;
      }

      lastRef.current = nextState;
      onChange(nextState);
    };

    update();

    map.on("zoomend", update);
    map.on("moveend", update);

    return () => {
      map.off("zoomend", update);
      map.off("moveend", update);
    };
  }, [map, onChange]);

  return null;
}
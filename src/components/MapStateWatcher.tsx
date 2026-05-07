"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type Props = {
  onChange: (state: {
    zoom: number;
    bounds: [number, number, number, number];
  }) => void;
};

export default function MapStateWatcher({ onChange }: Props) {
  const map = useMap();

  useEffect(() => {
    const update = () => {
      const bounds = map.getBounds();

      onChange({
        zoom: map.getZoom(),
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
      });
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
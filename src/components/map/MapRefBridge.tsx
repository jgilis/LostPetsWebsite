"use client";

import { useMap } from "react-leaflet";
import { useEffect } from "react";

type Props = {
  setMap: (map: any) => void;
};

export default function MapRefBridge({ setMap }: Props) {
  const map = useMap();

  useEffect(() => {
    setMap(map);

    return () => {
      try {
        map.closePopup();
        map.stop();
      } catch {
        // Map may already be torn down during route changes.
      }
      setMap(null);
    };
  }, [map, setMap]);

  return null;
}
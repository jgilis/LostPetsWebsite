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
  }, [map, setMap]);

  return null;
}
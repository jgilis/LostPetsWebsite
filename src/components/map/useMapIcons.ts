"use client";

import { useMemo } from "react";
import type { Icon } from "leaflet";

type AnimalType = "dog" | "cat" | "bird" | "rodent" | "other";

export function useMapIcons(L: any) {
  const icons = useMemo<Record<AnimalType, Icon> | null>(() => {
    if (!L) return null;

    const createIcon = (url: string) =>
      new L.Icon({
        iconUrl: url,
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

    return {
      dog: createIcon("/leaflet/marker-icon-blue.png"),
      cat: createIcon("/leaflet/marker-icon-gold.png"),
      bird: createIcon("/leaflet/marker-icon-violet.png"),
      rodent: createIcon("/leaflet/marker-icon-red.png"),
      other: createIcon("/leaflet/marker-icon-black.png"),
    };
  }, [L]);

  const getIcon = (animal: AnimalType) => {
    if (!icons) return undefined;
    return icons[animal];
  };

  const createPinIcon = (url: string) =>
    new L.Icon({
      iconUrl: url,
      shadowUrl: "/leaflet/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

  const sightingIcon = useMemo(() => {
    if (!L) return null;

    return createPinIcon("/leaflet/marker-icon-red.png");
  }, [L]);

  const reportOriginIcon = useMemo(() => {
    if (!L) return null;

    return createPinIcon("/leaflet/marker-icon-blue.png");
  }, [L]);

  const currentSightingIcon = useMemo(() => {
    if (!L) return null;

    return createPinIcon("/leaflet/marker-icon-red.png");
  }, [L]);

  return {
    icons,
    getIcon,
    sightingIcon,
    reportOriginIcon,
    currentSightingIcon,
  };
}
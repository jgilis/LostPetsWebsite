"use client";

import { useMemo } from "react";
import type { DivIcon } from "leaflet";
import { createSpeciesMarkerIcon } from "@/src/lib/map/speciesMarkerIcon";
import { speciesGlyphSvg } from "@/src/components/icons/speciesGlyphs";
import { STATUS_COLORS } from "@/src/lib/theme/colors";

type AnimalType = "dog" | "cat" | "bird" | "rodent" | "other";

function createSightingDivIcon(L: any, fill: string, selected = false): DivIcon {
  const glyph = speciesGlyphSvg("other", "#fffbf5", 14);
  return new L.DivIcon({
    className: `lp-marker lp-marker-found${selected ? " is-selected" : ""}`,
    html: `<span class="lp-marker-badge" style="background:${fill}">${glyph}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export function useMapIcons(L: any) {
  const icons = useMemo<Record<AnimalType, DivIcon> | null>(() => {
    if (!L) return null;

    return {
      dog: createSpeciesMarkerIcon("dog", "lost"),
      cat: createSpeciesMarkerIcon("cat", "lost"),
      bird: createSpeciesMarkerIcon("bird", "lost"),
      rodent: createSpeciesMarkerIcon("rodent", "lost"),
      other: createSpeciesMarkerIcon("other", "lost"),
    };
  }, [L]);

  const getIcon = (
    animal: AnimalType,
    reportType: "lost" | "found" = "lost",
    selected = false,
  ) => {
    if (!L) return undefined;
    return createSpeciesMarkerIcon(animal, reportType, selected);
  };

  const sightingIcon = useMemo(() => {
    if (!L) return null;
    return createSightingDivIcon(L, STATUS_COLORS.lost);
  }, [L]);

  const reportOriginIcon = useMemo(() => {
    if (!L) return null;
    return createSpeciesMarkerIcon("other", "lost");
  }, [L]);

  const currentSightingIcon = useMemo(() => {
    if (!L) return null;
    return createSightingDivIcon(L, STATUS_COLORS.lost, true);
  }, [L]);

  return {
    icons,
    getIcon,
    sightingIcon,
    reportOriginIcon,
    currentSightingIcon,
  };
}

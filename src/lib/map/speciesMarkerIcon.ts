import { speciesGlyphSvg } from "@/src/components/icons/speciesGlyphs";
import {
  SPECIES_COLORS,
  STATUS_COLORS,
  type ThemeAnimalType,
} from "@/src/lib/theme/colors";

function asAnimal(animalType: string): ThemeAnimalType {
  if (animalType in SPECIES_COLORS) return animalType as ThemeAnimalType;
  return "other";
}

export function createSpeciesMarkerIcon(
  animalType: string,
  reportType: "lost" | "found",
  selected = false,
) {
  const L = require("leaflet");
  const kind = asAnimal(animalType);
  const fill = SPECIES_COLORS[kind];
  const ring = reportType === "found" ? STATUS_COLORS.found : STATUS_COLORS.lost;
  const glyph = speciesGlyphSvg(kind, "#fffbf5", 18);
  const selectedClass = selected ? " is-selected" : "";

  if (reportType === "found") {
    return L.divIcon({
      className: `discover-found-marker lp-marker lp-marker-found${selectedClass}`,
      html: `<span class="discover-found-dot lp-marker-badge" style="background:${fill};box-shadow:0 0 0 2px ${ring}">${glyph}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -12],
    });
  }

  return L.divIcon({
    className: `lp-marker lp-marker-lost${selectedClass}`,
    html: `<span class="lp-marker-pin" style="background:${fill};box-shadow:0 0 0 2px ${ring}">${glyph}</span><span class="lp-marker-pointer" style="border-top-color:${fill}"></span>`,
    iconSize: [36, 46],
    iconAnchor: [18, 42],
    popupAnchor: [0, -36],
  });
}

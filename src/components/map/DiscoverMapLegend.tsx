"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";
import { DESKTOP_LAYOUT_QUERY } from "@/src/hooks/useDesktopLayout";
import SpeciesGlyph from "@/src/components/icons/SpeciesGlyph";
import { SPECIES_COLORS, STATUS_COLORS } from "@/src/lib/theme/colors";

const SPECIES: { key: TranslationKey; animal: keyof typeof SPECIES_COLORS }[] = [
  { key: "filterDog", animal: "dog" },
  { key: "filterCat", animal: "cat" },
  { key: "filterBird", animal: "bird" },
  { key: "filterRodent", animal: "rodent" },
  { key: "filterOther", animal: "other" },
];

export default function DiscoverMapLegend() {
  const { t } = useTranslation();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const label = t("mapLegendLabel");

  useEffect(() => {
    const legend = detailsRef.current;
    if (legend && window.matchMedia(DESKTOP_LAYOUT_QUERY).matches) {
      legend.open = true;
    }
  }, []);

  return (
    <details
      ref={detailsRef}
      className="discover-map-legend pointer-events-auto min-h-11 min-w-11 w-max max-w-[min(11.75rem,calc(100%-3.5rem))] overflow-hidden rounded-2xl border border-lp-line bg-lp-paper/95 text-[11px] leading-snug text-lp-ink shadow-[0_8px_20px_rgb(61_52_44_/_0.1)]"
    >
      <summary className="flex h-11 min-w-11 cursor-pointer list-none items-center justify-center px-2 font-semibold whitespace-nowrap md:min-h-[44px] md:justify-start md:px-3 [&::-webkit-details-marker]:hidden">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border border-lp-line-strong bg-lp-sage-soft text-[11px] font-bold text-lp-sage-dark md:hidden"
          aria-label={label}
        >
          i
        </span>
        <span className="hidden md:inline">{label}</span>
      </summary>
      <div className="discover-map-legend-body">
        <ul className="flex flex-col gap-1.5 px-3 pb-2">
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-3.5 w-2.5 shrink-0 rounded-t-[10px] rounded-b-[3px] border border-white"
              style={{ backgroundColor: STATUS_COLORS.lost }}
              aria-hidden
            />
            <span>{t("filterLost")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white"
              style={{ backgroundColor: STATUS_COLORS.found }}
              aria-hidden
            />
            <span>{t("filterFound")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-lp-sage/40 bg-lp-sage/15"
              aria-hidden
            />
            <span>{t("mapLegendArea")}</span>
          </li>
        </ul>
        <ul className="flex flex-wrap gap-x-2.5 gap-y-1.5 border-t border-lp-line px-3 pt-2 pb-2.5">
          {SPECIES.map((species) => (
            <li key={species.key} className="flex items-center gap-1.5">
              <SpeciesGlyph animalType={species.animal} size={14} />
              <span>{t(species.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

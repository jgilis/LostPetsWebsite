"use client";

import { useState, type MouseEvent, type SyntheticEvent } from "react";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";
import { useDesktopLayout } from "@/src/hooks/useDesktopLayout";

const SPECIES: { key: TranslationKey; color: string }[] = [
  { key: "filterDog", color: "#3b82f6" },
  { key: "filterCat", color: "#f59e0b" },
  { key: "filterBird", color: "#a855f7" },
  { key: "filterRodent", color: "#ef4444" },
  { key: "filterOther", color: "#111827" },
];

export default function DiscoverMapLegend() {
  const { t } = useTranslation();
  const isDesktop = useDesktopLayout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const label = t("mapLegendLabel");

  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (isDesktop) return;
    setMobileOpen(event.currentTarget.open);
  };

  const onSummaryClick = (event: MouseEvent<HTMLElement>) => {
    if (!isDesktop) return;
    event.preventDefault();
  };

  return (
    <details
      className="discover-map-legend pointer-events-auto min-h-11 min-w-11 w-max max-w-[min(11.75rem,calc(100%-3.5rem))] rounded-lg border border-gray-700/80 bg-gray-900/90 text-[11px] leading-snug text-gray-200 shadow"
      open={isDesktop ? true : mobileOpen}
      onToggle={onToggle}
    >
      <summary
        className="flex h-11 min-w-11 cursor-pointer list-none items-center justify-center px-2 font-semibold md:min-h-[44px] md:justify-start md:px-3 [&::-webkit-details-marker]:hidden"
        onClick={onSummaryClick}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-400 text-[11px] font-bold md:hidden"
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
              className="inline-block h-3.5 w-2.5 shrink-0 rounded-t-[10px] rounded-b-[3px] border border-white bg-gray-400 shadow"
              aria-hidden
            />
            <span>{t("filterLost")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-gray-400 shadow-[0_0_0_1px_#6b7280]"
              aria-hidden
            />
            <span>{t("filterFound")}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-gray-400 bg-gray-400/20"
              aria-hidden
            />
            <span>{t("mapLegendArea")}</span>
          </li>
        </ul>
        <ul className="flex flex-wrap gap-x-2.5 gap-y-1.5 border-t border-gray-700/80 px-3 pt-2 pb-2.5">
          {SPECIES.map((species) => (
            <li key={species.key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/70"
                style={{ backgroundColor: species.color }}
                aria-hidden
              />
              <span>{t(species.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

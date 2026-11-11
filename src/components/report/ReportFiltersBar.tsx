"use client";

import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";
import { SPECIES_COLORS } from "@/src/lib/theme/colors";

export type TypeFilter = "all" | "lost" | "found";
export type AnimalFilter = "all" | "dog" | "cat" | "bird" | "rodent" | "other";

const animalColors: Record<Exclude<AnimalFilter, "all">, string> = SPECIES_COLORS;

const ANIMAL_FILTER_LABELS: Record<AnimalFilter, TranslationKey> = {
  all: "filterAll",
  dog: "filterDog",
  cat: "filterCat",
  bird: "filterBird",
  rodent: "filterRodent",
  other: "filterOther",
};

const TYPE_FILTER_LABELS: Record<TypeFilter, TranslationKey> = {
  all: "filterAll",
  lost: "filterLost",
  found: "filterFound",
};

type ReportFiltersBarProps = {
  typeFilter: TypeFilter;
  animalFilter: AnimalFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  onAnimalFilterChange: (value: AnimalFilter) => void;
  sticky?: boolean;
};

export default function ReportFiltersBar({
  typeFilter,
  animalFilter,
  onTypeFilterChange,
  onAnimalFilterChange,
  sticky = false,
}: ReportFiltersBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className={
        sticky
          ? "report-filters-bar sticky top-0 z-[400] flex w-full min-w-0 max-w-full flex-col gap-1.5 bg-lp-paper pt-1"
          : "report-filters-bar flex w-full min-w-0 max-w-full flex-col gap-1.5"
      }
    >
      <div className="flex w-full min-w-0 justify-center overflow-x-hidden py-0.5">
        <div className="flex w-max max-w-full min-w-0 flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain px-2 py-1 touch-pan-x [-webkit-overflow-scrolling:touch]">
        {(["all", "dog", "cat", "bird", "rodent", "other"] as const).map((a) => {
          const isActive = animalFilter === a;
          const color =
            a === "all" ? "#8a7c6e" : animalColors[a];

          return (
            <button
              key={a}
              type="button"
              onClick={() => onAnimalFilterChange(a)}
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-normal"
              style={{
                borderColor: color,
                backgroundColor: isActive ? color : "transparent",
                color: isActive ? "#fffbf6" : "#3d342c",
              }}
            >
              {t(ANIMAL_FILTER_LABELS[a])}
            </button>
          );
        })}
        </div>
      </div>

      <div className="report-type-filters flex justify-center gap-1.5 pb-1.5">
        {(["all", "lost", "found"] as const).map((typeKey) => {
          const isActive = typeFilter === typeKey;

          return (
            <button
              key={typeKey}
              type="button"
              onClick={() => onTypeFilterChange(typeKey)}
              className="inline-flex items-center whitespace-nowrap rounded-full border border-lp-line-strong px-2.5 py-1 text-xs font-medium leading-normal"
              style={{
                backgroundColor: isActive ? "#3d342c" : "transparent",
                color: isActive ? "#fffbf6" : "#3d342c",
              }}
            >
              {t(TYPE_FILTER_LABELS[typeKey])}
            </button>
          );
        })}
      </div>
    </div>
  );
}

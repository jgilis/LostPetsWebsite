"use client";

import { useEffect } from "react";
import { FilterIcon } from "@/src/components/icons/NavIcons";
import ReportFiltersBar, {
  type AnimalFilter,
  type TypeFilter,
} from "../report/ReportFiltersBar";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

type DiscoverMobileFiltersProps = {
  typeFilter: TypeFilter;
  animalFilter: AnimalFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  onAnimalFilterChange: (value: AnimalFilter) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const TYPE_LABELS: Record<TypeFilter, TranslationKey> = {
  all: "filterAll",
  lost: "filterLost",
  found: "filterFound",
};

const ANIMAL_LABELS: Record<AnimalFilter, TranslationKey> = {
  all: "filterAll",
  dog: "filterDog",
  cat: "filterCat",
  bird: "filterBird",
  rodent: "filterRodent",
  other: "filterOther",
};

export default function DiscoverMobileFilters({
  typeFilter,
  animalFilter,
  onTypeFilterChange,
  onAnimalFilterChange,
  open,
  onOpen,
  onClose,
}: DiscoverMobileFiltersProps) {
  const { t } = useTranslation();
  const filtersActive = typeFilter !== "all" || animalFilter !== "all";
  const summary = [
    typeFilter !== "all" ? t(TYPE_LABELS[typeFilter]) : null,
    animalFilter !== "all" ? t(ANIMAL_LABELS[animalFilter]) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className="discover-filters-btn inline-flex min-h-11 items-center gap-2 rounded-full border border-lp-line bg-lp-paper/95 px-3 text-sm font-medium text-lp-ink shadow-[0_4px_14px_rgb(61_52_44_/_0.08)]"
        aria-expanded={open}
        aria-controls="discover-filter-sheet"
        onClick={() => (open ? onClose() : onOpen())}
      >
        <FilterIcon className="h-4 w-4" />
        {t("discoverFilters")}
        {filtersActive ? (
          <span className="rounded-full bg-lp-sage-soft px-2 py-0.5 text-xs font-medium text-lp-sage-dark">
            {summary}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="discover-filter-sheet fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-0 z-[530] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("discoverDetailClose")}
            onClick={onClose}
          />
          <div
            id="discover-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="discover-filter-title"
            className="absolute inset-x-0 bottom-0 max-h-[min(70dvh,32rem)] overflow-y-auto rounded-t-2xl border border-lp-line bg-lp-paper pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between border-b border-lp-line px-3 py-2">
              <h2
                id="discover-filter-title"
                className="text-sm font-medium text-lp-ink"
              >
                {t("discoverFilters")}
              </h2>
              <button
                type="button"
                className="min-h-11 px-3 text-sm font-medium text-lp-ink-muted"
                onClick={onClose}
              >
                {t("discoverDetailClose")}
              </button>
            </div>
            <div className="px-2 py-3">
              <ReportFiltersBar
                typeFilter={typeFilter}
                animalFilter={animalFilter}
                onTypeFilterChange={onTypeFilterChange}
                onAnimalFilterChange={onAnimalFilterChange}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

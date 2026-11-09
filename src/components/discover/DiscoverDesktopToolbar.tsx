"use client";

import { useEffect, useId, useRef, useState } from "react";
import type {
  AnimalFilter,
  TypeFilter,
} from "../report/ReportFiltersBar";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

export type NearbySource = "off" | "map" | "device";

type MenuId = "status" | "animal" | "nearby";

type Option<T extends string> = {
  value: T;
  labelKey: TranslationKey;
};

const STATUS_OPTIONS: Option<TypeFilter>[] = [
  { value: "all", labelKey: "filterAll" },
  { value: "lost", labelKey: "filterLost" },
  { value: "found", labelKey: "filterFound" },
];

const ANIMAL_OPTIONS: Option<AnimalFilter>[] = [
  { value: "all", labelKey: "filterAll" },
  { value: "dog", labelKey: "filterDog" },
  { value: "cat", labelKey: "filterCat" },
  { value: "bird", labelKey: "filterBird" },
  { value: "rodent", labelKey: "filterRodent" },
  { value: "other", labelKey: "filterOther" },
];

const NEARBY_OPTIONS: Option<NearbySource>[] = [
  { value: "off", labelKey: "discoverNearbyOff" },
  { value: "map", labelKey: "discoverNearbyMapCentre" },
  { value: "device", labelKey: "discoverNearbyMyLocation" },
];

type DiscoverDesktopToolbarProps = {
  typeFilter: TypeFilter;
  animalFilter: AnimalFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  onAnimalFilterChange: (value: AnimalFilter) => void;
  nearbySource: NearbySource;
  onNearbySourceChange: (value: NearbySource) => void;
  nearbyError: string | null;
};

function menuButtonClass(active: boolean) {
  return `inline-flex min-h-[36px] items-center gap-1.5 rounded-md border px-2.5 text-left text-sm ${
    active
      ? "border-gray-500 bg-gray-800 text-white"
      : "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500"
  }`;
}

export default function DiscoverDesktopToolbar({
  typeFilter,
  animalFilter,
  onTypeFilterChange,
  onAnimalFilterChange,
  nearbySource,
  onNearbySourceChange,
  nearbyError,
}: DiscoverDesktopToolbarProps) {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const statusId = useId();
  const animalId = useId();
  const nearbyId = useId();

  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const statusLabel = t(
    STATUS_OPTIONS.find((option) => option.value === typeFilter)?.labelKey ??
      "filterAll",
  );
  const animalLabel = t(
    ANIMAL_OPTIONS.find((option) => option.value === animalFilter)?.labelKey ??
      "filterAll",
  );
  const nearbyValueLabel = t(
    NEARBY_OPTIONS.find((option) => option.value === nearbySource)?.labelKey ??
      "discoverNearbyOff",
  );
  const nearbyActive = nearbySource !== "off";

  return (
    <div
      ref={rootRef}
      className="discover-desktop-toolbar flex flex-wrap items-center gap-2"
    >
      <FilterMenu
        id={statusId}
        label={t("discoverFilterStatus")}
        valueLabel={statusLabel}
        options={STATUS_OPTIONS}
        value={typeFilter}
        open={openMenu === "status"}
        onToggle={() =>
          setOpenMenu((current) => (current === "status" ? null : "status"))
        }
        onChange={(value) => {
          onTypeFilterChange(value);
          setOpenMenu(null);
        }}
      />
      <FilterMenu
        id={animalId}
        label={t("discoverFilterAnimal")}
        valueLabel={animalLabel}
        options={ANIMAL_OPTIONS}
        value={animalFilter}
        open={openMenu === "animal"}
        onToggle={() =>
          setOpenMenu((current) => (current === "animal" ? null : "animal"))
        }
        onChange={(value) => {
          onAnimalFilterChange(value);
          setOpenMenu(null);
        }}
      />
      <FilterMenu
        id={nearbyId}
        label={t("discoverWithin500m")}
        valueLabel={nearbyActive ? nearbyValueLabel : t("discoverNearbyOff")}
        options={NEARBY_OPTIONS}
        value={nearbySource}
        open={openMenu === "nearby"}
        active={nearbyActive}
        onToggle={() =>
          setOpenMenu((current) => (current === "nearby" ? null : "nearby"))
        }
        onChange={(value) => {
          onNearbySourceChange(value);
          setOpenMenu(null);
        }}
      />
      {nearbyError ? (
        <p className="w-full text-xs text-amber-200" role="status">
          {nearbyError}
        </p>
      ) : null}
    </div>
  );
}

function FilterMenu<T extends string>({
  id,
  label,
  valueLabel,
  options,
  value,
  open,
  active = false,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  valueLabel: string;
  options: Option<T>[];
  value: T;
  open: boolean;
  active?: boolean;
  onToggle: () => void;
  onChange: (value: T) => void;
}) {
  const { t } = useTranslation();
  const listId = `${id}-list`;

  return (
    <div className="relative">
      <button
        type="button"
        className={menuButtonClass(active || open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
      >
        <span className="text-gray-400">{label}</span>
        <span className="font-medium">{valueLabel}</span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 z-30 mt-1 min-w-full rounded-md border border-gray-700 bg-gray-900 py-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full px-3 py-1.5 text-left text-sm ${
                    selected
                      ? "bg-gray-800 font-medium text-white"
                      : "text-gray-200 hover:bg-gray-800"
                  }`}
                  onClick={() => onChange(option.value)}
                >
                  {t(option.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";
import type {
  ActivityEventType,
  ActivityOwnershipFilter,
} from "./activityEvents";

type Option<T extends string> = {
  value: T;
  labelKey: TranslationKey;
};

export const ACTIVITY_EVENT_OPTIONS: Option<ActivityEventType>[] = [
  { value: "all", labelKey: "activityEventAll" },
  { value: "missing", labelKey: "activityEventMissing" },
  { value: "found", labelKey: "activityEventFound" },
  { value: "sightings", labelKey: "activityEventSightings" },
  { value: "reunited", labelKey: "activityEventReunited" },
];

type ActivityToolbarProps = {
  eventType: ActivityEventType;
  onEventTypeChange: (value: ActivityEventType) => void;
  ownershipFilter: ActivityOwnershipFilter;
  onOwnershipFilterChange: (value: ActivityOwnershipFilter) => void;
};

function menuButtonClass(active: boolean) {
  return `inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-2.5 text-left text-sm ${
    active
      ? "border-lp-sage bg-lp-sage-soft text-lp-sage-dark"
      : "border-lp-line bg-lp-paper text-lp-ink hover:border-lp-line-strong"
  }`;
}

export default function ActivityToolbar({
  eventType,
  onEventTypeChange,
  ownershipFilter,
  onOwnershipFilterChange,
}: ActivityToolbarProps) {
  const { t } = useTranslation();
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const typeMenuId = useId();
  const mineOn = ownershipFilter === "mine";
  const typeLabel =
    ACTIVITY_EVENT_OPTIONS.find((option) => option.value === eventType)
      ?.labelKey ?? "activityEventAll";
  const typeValueLabel = t(typeLabel);

  useEffect(() => {
    if (!typeMenuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!desktopRef.current?.contains(event.target as Node)) {
        setTypeMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTypeMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [typeMenuOpen]);

  useEffect(() => {
    if (!typeSheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTypeSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typeSheetOpen]);

  const toggleMine = () => {
    onOwnershipFilterChange(mineOn ? "all" : "mine");
  };

  return (
    <>
      <div className="shrink-0 border-b border-lp-line">
        {!mineOn ? (
          <p className="px-3 pt-2 text-xs font-medium text-lp-ink-subtle">
            {t("activityAreaScope")}
          </p>
        ) : null}
        <div className="flex items-center gap-2 px-3 py-2 md:hidden">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-0 flex-1 items-center rounded-full border border-lp-line bg-lp-paper px-3 text-left text-sm font-medium text-lp-ink"
            aria-expanded={typeSheetOpen}
            aria-controls="activity-type-sheet"
            onClick={() => setTypeSheetOpen((open) => !open)}
          >
            <span className="truncate">{typeValueLabel}</span>
          </button>
          <MineToggle pressed={mineOn} onClick={toggleMine} compact />
        </div>

        <div
          ref={desktopRef}
          className="hidden shrink-0 items-center gap-2 px-3 py-3 md:flex"
        >
          <TypeMenu
            id={typeMenuId}
            value={eventType}
            valueLabel={typeValueLabel}
            open={typeMenuOpen}
            onToggle={() => setTypeMenuOpen((open) => !open)}
            onChange={(value) => {
              onEventTypeChange(value);
              setTypeMenuOpen(false);
            }}
          />
          <MineToggle pressed={mineOn} onClick={toggleMine} />
        </div>
      </div>

      {typeSheetOpen ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-0 z-[546] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("discoverDetailClose")}
            onClick={() => setTypeSheetOpen(false)}
          />
          <div
            id="activity-type-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-type-title"
            className="absolute inset-x-0 bottom-0 max-h-[min(70dvh,32rem)] overflow-y-auto rounded-t-2xl border border-lp-line bg-lp-paper pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between border-b border-lp-line px-3 py-2">
              <h2
                id="activity-type-title"
                className="text-sm font-medium text-lp-ink"
              >
                {t("activityEventType")}
              </h2>
              <button
                type="button"
                className="min-h-11 px-3 text-sm font-medium text-lp-ink-muted"
                onClick={() => setTypeSheetOpen(false)}
              >
                {t("discoverDetailClose")}
              </button>
            </div>
            <ul className="py-1" role="listbox">
              {ACTIVITY_EVENT_OPTIONS.map((option) => {
                const selected = option.value === eventType;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex min-h-11 w-full px-4 text-left text-sm ${
                        selected
                          ? "bg-lp-sage-soft font-medium text-lp-ink"
                          : "text-lp-ink"
                      }`}
                      onClick={() => {
                        onEventTypeChange(option.value);
                        setTypeSheetOpen(false);
                      }}
                    >
                      {t(option.labelKey)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MineToggle({
  pressed,
  onClick,
  compact = false,
}: {
  pressed: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={
        compact
          ? `inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm font-medium ${
              pressed
                ? "border-lp-sage bg-lp-sage-soft text-lp-sage-dark"
                : "border-lp-line bg-lp-paper text-lp-ink"
            }`
          : menuButtonClass(pressed)
      }
      aria-pressed={pressed}
      onClick={onClick}
    >
      {t(pressed ? "activityScopeAll" : "feedOwnershipMine")}
    </button>
  );
}

function TypeMenu({
  id,
  value,
  valueLabel,
  open,
  onToggle,
  onChange,
}: {
  id: string;
  value: ActivityEventType;
  valueLabel: string;
  open: boolean;
  onToggle: () => void;
  onChange: (value: ActivityEventType) => void;
}) {
  const { t } = useTranslation();
  const listId = `${id}-list`;

  return (
    <div className="relative">
      <button
        type="button"
        className={menuButtonClass(open || value !== "all")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
      >
        <span className="text-lp-ink-subtle">{t("activityEventType")}</span>
        <span className="font-medium">{valueLabel}</span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 z-30 mt-1 min-w-full rounded-xl border border-lp-line bg-lp-paper py-1 shadow-lg"
        >
          {ACTIVITY_EVENT_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full px-3 py-1.5 text-left text-sm ${
                    selected
                      ? "bg-lp-sage-soft font-medium text-lp-ink"
                      : "text-lp-ink hover:bg-lp-paper-muted"
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

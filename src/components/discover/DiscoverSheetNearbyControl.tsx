"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { NearbySource } from "./DiscoverDesktopToolbar";
import type { TranslationKey } from "@/src/i18n/types";

const NEARBY_OPTIONS: { value: NearbySource; labelKey: TranslationKey }[] = [
  { value: "off", labelKey: "discoverNearbyOff" },
  { value: "map", labelKey: "discoverNearbyMapCentre" },
  { value: "device", labelKey: "discoverNearbyMyLocation" },
];

type DiscoverSheetNearbyControlProps = {
  nearbySource: NearbySource;
  onNearbySourceChange: (value: NearbySource) => void;
  nearbyError?: string | null;
};

export default function DiscoverSheetNearbyControl({
  nearbySource,
  onNearbySourceChange,
  nearbyError = null,
}: DiscoverSheetNearbyControlProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{ bottom: number; right: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const active = nearbySource !== "off";
  const valueLabel = t(
    NEARBY_OPTIONS.find((option) => option.value === nearbySource)?.labelKey ??
      "discoverNearbyOff",
  );

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuBox({
      bottom: window.innerHeight - rect.top + 4,
      right: window.innerWidth - rect.right,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && menuBox && typeof document !== "undefined"
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            className="fixed z-[535] min-w-[11.5rem] rounded-xl border border-lp-line bg-lp-paper py-1 shadow-lg"
            style={{ bottom: menuBox.bottom, right: menuBox.right }}
          >
            <li className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-lp-ink-subtle">
              {t("discoverWithin500m")}
            </li>
            {NEARBY_OPTIONS.map((option) => {
              const selected = option.value === nearbySource;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`flex min-h-11 w-full items-center px-3 text-left text-sm ${
                      selected
                        ? "bg-lp-sage-soft font-medium text-lp-ink"
                        : "text-lp-ink hover:bg-lp-paper-muted"
                    }`}
                    onClick={() => {
                      onNearbySourceChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {t(option.labelKey)}
                  </button>
                </li>
              );
            })}
            {nearbyError ? (
              <li className="px-3 py-2 text-xs text-lp-coral" role="status">
                {nearbyError}
              </li>
            ) : null}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex h-11 max-w-[7.5rem] items-center justify-center rounded-md border px-2 text-left text-[11px] leading-tight ${
          active
            ? "border-lp-sage bg-lp-sage-soft text-lp-sage-dark"
            : "border-lp-line bg-lp-paper text-lp-ink-muted"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t("discoverWithin500m")}: ${valueLabel}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">
          {active ? `500 m · ${valueLabel}` : "500 m"}
        </span>
      </button>
      {menu}
    </div>
  );
}

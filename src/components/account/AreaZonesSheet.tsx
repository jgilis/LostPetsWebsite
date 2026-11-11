"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import LocationPicker from "@/src/components/report/LocationPicker";
import {
  AREA_ANIMAL_TYPES,
  AREA_RADIUS_METERS,
  MAX_AREA_LABEL_LENGTH,
  MAX_AREA_SUBSCRIPTIONS,
  createAreaSubscription,
  deleteAreaSubscription,
  listAreaSubscriptions,
  updateAreaSubscription,
  type AreaAnimalType,
  type AreaRadiusMeters,
  type AreaSubscription,
} from "@/src/lib/areaSubscriptions";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

const ANIMAL_LABELS: Record<AreaAnimalType, TranslationKey> = {
  dog: "animalDog",
  cat: "animalCat",
  bird: "animalBird",
  rodent: "animalRodent",
  other: "animalOther",
};

const RADIUS_LABELS: Record<AreaRadiusMeters, TranslationKey> = {
  500: "zoneRadius500",
  1000: "zoneRadius1km",
  2000: "zoneRadius2km",
};

const DEFAULT_LAT = 51.025;
const DEFAULT_LNG = 4.477;

type AreaZonesSheetProps = {
  onClose: () => void;
};

export default function AreaZonesSheet({ onClose }: AreaZonesSheetProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [zones, setZones] = useState<AreaSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [radius, setRadius] = useState<AreaRadiusMeters>(500);
  const [animalType, setAnimalType] = useState<AreaAnimalType | "">("");
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const refresh = async () => {
    const rows = await listAreaSubscriptions();
    setZones(rows);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t("zoneLocationDenied"));
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      () => {
        setError(t("zoneLocationDenied"));
        setLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 0, timeout: 10000 },
    );
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || zones.length >= MAX_AREA_SUBSCRIPTIONS) return;
    setSaving(true);
    setError("");
    const result = await createAreaSubscription({
      label,
      latitude,
      longitude,
      radius_m: radius,
      animal_type: animalType === "" ? null : animalType,
    });
    setSaving(false);
    if (!result.ok) {
      setError(t("zoneSaveFailed"));
      return;
    }
    setAdding(false);
    setLabel("");
    setRadius(500);
    setAnimalType("");
    setLatitude(DEFAULT_LAT);
    setLongitude(DEFAULT_LNG);
    await refresh();
  };

  const sheet = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("discoverDetailClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[min(90dvh,calc(100%-2rem))] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-lp-line bg-lp-paper p-6 text-lp-ink md:rounded-2xl"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {t("zoneAlertsTitle")}
        </h2>
        <p className="mt-2 text-sm text-lp-ink-muted">{t("zoneAlertsHint")}</p>

        {loading ? (
          <p className="mt-4 text-sm text-lp-ink-muted">{t("zoneLoading")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {zones.length === 0 ? (
              <li className="text-sm text-lp-ink-muted">{t("zoneEmpty")}</li>
            ) : (
              zones.map((zone) => (
                <li
                  key={zone.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-gray-800 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{zone.label}</p>
                    <p className="text-xs text-lp-ink-muted">
                      {t(RADIUS_LABELS[zone.radius_m])}
                      {" · "}
                      {zone.animal_type
                        ? t(ANIMAL_LABELS[zone.animal_type])
                        : t("zoneSpeciesAll")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void updateAreaSubscription(zone.id, {
                        enabled: !zone.enabled,
                      }).then((ok) => {
                        if (ok) void refresh();
                      })
                    }
                    className="rounded-full bg-lp-sage-soft px-3 py-2 text-xs text-lp-sage-dark hover:bg-lp-sage/20"
                  >
                    {zone.enabled ? t("zoneOn") : t("zoneOff")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(t("zoneDeleteConfirm"))) return;
                      void deleteAreaSubscription(zone.id).then((ok) => {
                        if (ok) void refresh();
                      });
                    }}
                    className="rounded-full bg-lp-coral px-3 py-2 text-xs text-white hover:bg-lp-coral/80"
                  >
                    {t("zoneDelete")}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {zones.length >= MAX_AREA_SUBSCRIPTIONS && !adding ? (
          <p className="mt-4 text-sm text-amber-300">{t("zoneLimit")}</p>
        ) : null}

        {adding ? (
          <form
            onSubmit={(event) => void handleCreate(event)}
            className="mt-4 space-y-3 border-t border-gray-800 pt-4"
          >
            <label className="block text-sm">
              <span className="mb-1 block text-lp-ink-muted">{t("zoneLabel")}</span>
              <input
                value={label}
                maxLength={MAX_AREA_LABEL_LENGTH}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={t("zoneLabelPlaceholder")}
                className="w-full rounded-xl border border-lp-line bg-lp-paper-muted p-2 text-sm text-lp-ink"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-lp-ink-muted">{t("zoneRadius")}</span>
              <select
                value={radius}
                onChange={(event) =>
                  setRadius(Number(event.target.value) as AreaRadiusMeters)
                }
                className="w-full rounded-xl border border-lp-line bg-lp-paper-muted p-2 text-sm text-lp-ink"
              >
                {AREA_RADIUS_METERS.map((value) => (
                  <option key={value} value={value}>
                    {t(RADIUS_LABELS[value])}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-lp-ink-muted">{t("zoneSpecies")}</span>
              <select
                value={animalType}
                onChange={(event) =>
                  setAnimalType(
                    event.target.value === ""
                      ? ""
                      : (event.target.value as AreaAnimalType),
                  )
                }
                className="w-full rounded-xl border border-lp-line bg-lp-paper-muted p-2 text-sm text-lp-ink"
              >
                <option value="">{t("zoneSpeciesAll")}</option>
                {AREA_ANIMAL_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(ANIMAL_LABELS[value])}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="inline-flex min-h-[44px] items-center rounded-full bg-lp-sage px-4 text-sm text-white hover:bg-lp-sage-dark disabled:opacity-60"
            >
              {locating ? t("zoneLocating") : t("zoneUseMyLocation")}
            </button>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              setLatitude={setLatitude}
              setLongitude={setLongitude}
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving || !label.trim()}
                className="inline-flex min-h-[44px] items-center rounded-md bg-white px-4 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
              >
                {saving ? t("zoneSaving") : t("zoneSave")}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="inline-flex min-h-[44px] items-center rounded-full bg-lp-paper-muted px-4 text-sm text-lp-ink hover:bg-lp-line"
              >
                {t("sightingCancel")}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {zones.length < MAX_AREA_SUBSCRIPTIONS ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex min-h-[44px] items-center rounded-md bg-white px-4 text-sm font-medium text-black hover:opacity-90"
              >
                {t("zoneAdd")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center rounded-full bg-lp-paper-muted px-4 text-sm text-lp-ink hover:bg-lp-line"
            >
              {t("sightingClose")}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}

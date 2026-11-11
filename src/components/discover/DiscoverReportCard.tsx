"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatReportTimestampDisplay } from "@/src/lib/reportTimestamps";
import type { Report } from "@/src/lib/reports";
import type { ProximityEvent } from "@/src/lib/geo/types";
import { formatProximityDistance } from "@/src/lib/geo/formatProximityDistance";
import {
  getAttentionFlags,
  getDominantAttention,
} from "@/src/lib/geo/proximityAttention";
import { isSeen, markSeen } from "@/src/lib/geo/proximityMemory";
import LocationDisplay from "@/src/components/location/LocationDisplay";
import SpeciesGlyph from "@/src/components/icons/SpeciesGlyph";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";
import { speciesColor } from "@/src/lib/theme/colors";

const ANIMAL_LABEL_KEYS: Record<Report["animal_type"], TranslationKey> = {
  dog: "animalDog",
  cat: "animalCat",
  bird: "animalBird",
  rodent: "animalRodent",
  other: "animalOther",
};

type DiscoverReportCardProps = {
  report: Report;
  selected: boolean;
  onSelect: (id: string) => void;
  proximity?: ProximityEvent | null;
};

export default function DiscoverReportCard({
  report,
  selected,
  onSelect,
  proximity = null,
}: DiscoverReportCardProps) {
  const { t } = useTranslation();
  const [photoBroken, setPhotoBroken] = useState(false);
  const markedRef = useRef(false);
  const [, setDisplayRevision] = useState(0);

  useLayoutEffect(() => {
    if (!proximity || markedRef.current) return;
    markedRef.current = true;
    const wasUnseen = !isSeen(report.id);
    markSeen(report.id);
    if (wasUnseen) {
      setDisplayRevision((revision) => revision + 1);
    }
  }, [proximity, report.id]);
  const typeLabel =
    report.type === "lost" ? t("reportLost") : t("reportFound");
  const title = report.animal_name?.trim()
    ? report.animal_name
    : t(ANIMAL_LABEL_KEYS[report.animal_type]);
  const reportedAt = formatReportTimestampDisplay(report);
  const hasPhoto = !!report.photo_url && !photoBroken;
  const attention = proximity
    ? getDominantAttention(getAttentionFlags(proximity))
    : "none";
  const showAsSeen = attention === "seen" || (!!proximity && isSeen(report.id));
  const attentionLabel =
    attention === "very-close"
      ? "Very close"
      : attention === "new-nearby" && !showAsSeen
        ? "New nearby"
        : showAsSeen
          ? "Seen"
          : null;
  const accent = speciesColor(report.animal_type);

  return (
    <article
      data-report-id={report.id}
      className={`overflow-hidden rounded-2xl border bg-lp-paper ${
        selected
          ? "border-lp-sage ring-1 ring-lp-sage"
          : "border-lp-line"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(report.id)}
        aria-pressed={selected}
        className="flex w-full gap-3 p-2.5 text-left"
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-lp-paper-muted">
          {hasPhoto ? (
            <img
              src={report.photo_url!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setPhotoBroken(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <SpeciesGlyph animalType={report.animal_type} size={28} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-lp-ink">{title}</p>
          <p className="truncate text-xs text-lp-ink-muted">
            {t(ANIMAL_LABEL_KEYS[report.animal_type])} · {typeLabel}
          </p>
          <div className="mt-0.5 truncate text-[11px] text-lp-ink-subtle">
            <LocationDisplay
              latitude={report.latitude}
              longitude={report.longitude}
            />
            {reportedAt ? <span> · {reportedAt}</span> : null}
          </div>
          {proximity ? (
            <p className="mt-0.5 truncate text-[11px] text-lp-ink-muted">
              {formatProximityDistance(proximity.distanceMeters)}
              {attentionLabel ? (
                <span
                  className={
                    attention === "very-close"
                      ? "ml-1 font-medium text-lp-coral"
                      : "ml-1 text-lp-ink-subtle"
                  }
                >
                  · {attentionLabel}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </button>
    </article>
  );
}

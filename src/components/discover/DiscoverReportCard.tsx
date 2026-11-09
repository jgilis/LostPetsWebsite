"use client";

import { useState } from "react";
import { formatReportTimestampDisplay } from "@/src/lib/reportTimestamps";
import type { Report } from "@/src/lib/reports";
import LocationDisplay from "@/src/components/location/LocationDisplay";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

const ANIMAL_LABEL_KEYS: Record<Report["animal_type"], TranslationKey> = {
  dog: "animalDog",
  cat: "animalCat",
  bird: "animalBird",
  rodent: "animalRodent",
  other: "animalOther",
};

const ANIMAL_COLORS: Record<Report["animal_type"], string> = {
  dog: "#3b82f6",
  cat: "#f59e0b",
  bird: "#a855f7",
  rodent: "#ef4444",
  other: "#111827",
};

type DiscoverReportCardProps = {
  report: Report;
  selected: boolean;
  onSelect: (id: string) => void;
};

export default function DiscoverReportCard({
  report,
  selected,
  onSelect,
}: DiscoverReportCardProps) {
  const { t } = useTranslation();
  const [photoBroken, setPhotoBroken] = useState(false);
  const typeLabel =
    report.type === "lost" ? t("reportLost") : t("reportFound");
  const title = report.animal_name?.trim()
    ? report.animal_name
    : t(ANIMAL_LABEL_KEYS[report.animal_type]);
  const reportedAt = formatReportTimestampDisplay(report);
  const hasPhoto = !!report.photo_url && !photoBroken;

  return (
    <article
      data-report-id={report.id}
      className={`overflow-hidden rounded-xl border bg-gray-900/80 ${
        selected
          ? "border-white ring-1 ring-white"
          : "border-gray-800/90"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(report.id)}
        aria-pressed={selected}
        className="flex w-full gap-3 p-2.5 text-left"
        style={{ borderLeft: `4px solid ${ANIMAL_COLORS[report.animal_type]}` }}
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-800">
          {hasPhoto ? (
            <img
              src={report.photo_url!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setPhotoBroken(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-gray-500">
              {report.type === "lost" ? "📍" : "●"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          <p className="truncate text-xs text-gray-400">
            {t(ANIMAL_LABEL_KEYS[report.animal_type])} · {typeLabel}
          </p>
          <div className="mt-0.5 truncate text-[11px] text-gray-500">
            <LocationDisplay
              latitude={report.latitude}
              longitude={report.longitude}
            />
            {reportedAt ? <span> · {reportedAt}</span> : null}
          </div>
        </div>
      </button>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  readAndClearFeedScrollPosition,
  reportDetailHref,
  saveFeedScrollPosition,
} from "@/src/lib/reportNavigation";
import { formatReportTimestampDisplay } from "@/src/lib/reportTimestamps";
import { useReports, type Report } from "../report/useReports";
import {
  filterFeedReports,
  type FeedLifecycleFilter,
} from "../map/filters";
import { isPublicFeedReport } from "@/src/lib/reports";
import type { AnimalFilter, TypeFilter } from "../report/ReportFiltersBar";
import {
  formatReportLocation,
  truncateText,
} from "@/src/lib/adminReports";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { isOwner } from "@/src/lib/permissions";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

type OwnershipFilter = "all" | "mine";

const ANIMAL_LABEL_KEYS: Record<Report["animal_type"], TranslationKey> = {
  dog: "animalDog",
  cat: "animalCat",
  bird: "animalBird",
  rodent: "animalRodent",
  other: "animalOther",
};

const ANIMAL_PLACEHOLDER: Record<
  Report["animal_type"],
  { gradient: string; symbol: string }
> = {
  dog: { gradient: "from-slate-800 via-slate-700/90 to-slate-900", symbol: "🐕" },
  cat: { gradient: "from-amber-950/80 via-stone-800 to-slate-900", symbol: "🐈" },
  bird: { gradient: "from-indigo-950/70 via-slate-800 to-slate-900", symbol: "🐦" },
  rodent: { gradient: "from-rose-950/60 via-stone-800 to-slate-900", symbol: "🐹" },
  other: { gradient: "from-gray-800 via-slate-800 to-gray-950", symbol: "🐾" },
};

function reportSortTime(report: Report): number {
  const raw = report.date_reported;
  if (!raw) return 0;

  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortReportsNewestFirst(reports: Report[]): Report[] {
  return [...reports].sort(
    (a, b) => reportSortTime(b) - reportSortTime(a),
  );
}

type ReportsFeedProps = {
  typeFilter: TypeFilter;
  animalFilter: AnimalFilter;
};

function FeedSkeleton() {
  return (
    <ul
      className="mx-auto w-full max-w-lg space-y-5 md:max-w-xl md:space-y-4 xl:space-y-3.5"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-gray-800/80 bg-gray-900/50"
        >
          <div className="aspect-[4/3] w-full bg-gray-800/80 md:aspect-[16/10] xl:aspect-[18/10]" />
          <div className="space-y-2 p-4 md:space-y-1.5 md:p-3">
            <div className="h-5 w-2/3 rounded bg-gray-800" />
            <div className="h-3 w-1/2 rounded bg-gray-800/80" />
            <div className="h-3 w-full rounded bg-gray-800/60" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReportFeedCard({
  report,
  onBeforeNavigate,
  emphasizeOwned,
}: {
  report: Report;
  onBeforeNavigate: () => void;
  emphasizeOwned: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [photoBroken, setPhotoBroken] = useState(false);
  const reportIsOwner = isOwner(user?.id, report.owner_user_id);
  const location = formatReportLocation(report.latitude, report.longitude);
  const reportedAt = formatReportTimestampDisplay(report);
  const description = report.description?.trim();
  const typeLabel =
    report.type === "lost" ? t("reportLost") : t("reportFound");
  const isResolved = report.status === "resolved";
  const hasPhoto = !!report.photo_url && !photoBroken;
  const placeholder = ANIMAL_PLACEHOLDER[report.animal_type];
  const title = report.animal_name?.trim()
    ? report.animal_name
    : t(ANIMAL_LABEL_KEYS[report.animal_type]);

  const borderClass =
    emphasizeOwned && reportIsOwner
      ? "border-sky-800/50"
      : isResolved
        ? "border-emerald-800/35"
        : "border-gray-800/90";

  return (
    <Link
      href={reportDetailHref(report.id, "feed")}
      onClick={onBeforeNavigate}
      className={`group block w-full overflow-hidden rounded-xl border bg-gray-900/80 text-left shadow-sm transition-colors hover:border-gray-600 hover:bg-gray-900 active:bg-gray-800/90 ${borderClass}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900 md:aspect-[16/10] xl:aspect-[18/10]">
        {hasPhoto ? (
          <img
            src={report.photo_url!}
            alt=""
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover ${
              isResolved ? "brightness-[0.97] saturate-[0.92]" : ""
            }`}
            onError={() => setPhotoBroken(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${placeholder.gradient} px-6 text-center`}
            aria-hidden
          >
            <span
              className="text-4xl opacity-80 md:text-3xl"
              role="presentation"
            >
              {placeholder.symbol}
            </span>
            <span className="mt-2 text-xs font-medium tracking-wide text-gray-400/90">
              {t("feedNoPhoto")}
            </span>
          </div>
        )}

        {isResolved ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-emerald-900/10"
            aria-hidden
          />
        ) : null}

        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1.5 p-2.5 md:p-2">
          {isResolved ? (
            <span className="rounded-full border border-emerald-700/40 bg-emerald-950/75 px-2 py-0.5 text-xs font-medium text-emerald-100/95 backdrop-blur-sm">
              {t("reportResolved")}
            </span>
          ) : null}
          {reportIsOwner ? (
            <span className="rounded-full border border-sky-800/40 bg-sky-950/75 px-2 py-0.5 text-xs font-medium text-sky-100/95 backdrop-blur-sm">
              {t("reportYourReport")}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-3 pt-10 md:px-3 md:pb-2.5 md:pt-8">
          <p className="text-lg font-semibold leading-tight text-white drop-shadow-sm md:text-base">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-gray-200/90 md:text-xs">
            {t(ANIMAL_LABEL_KEYS[report.animal_type])} · {typeLabel}
          </p>
        </div>
      </div>

      <div className="space-y-2 px-3.5 py-3 md:space-y-1.5 md:px-3 md:py-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 md:text-[11px] md:leading-snug">
          {location ? (
            <span className="text-gray-400">{location}</span>
          ) : null}
          {location && reportedAt ? (
            <span className="text-gray-600" aria-hidden>
              ·
            </span>
          ) : null}
          {reportedAt ? (
            <time className="text-gray-500">{reportedAt}</time>
          ) : null}
        </div>

        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-400/95 md:text-xs md:leading-snug">
            {truncateText(description, 100)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function ReportsFeed({
  typeFilter,
  animalFilter,
}: ReportsFeedProps) {
  const { reports, loading } = useReports();
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const scrollRef = useRef<HTMLUListElement>(null);
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [lifecycleFilter, setLifecycleFilter] =
    useState<FeedLifecycleFilter>("active");

  const sortedReports = useMemo(() => {
    let filtered = filterFeedReports(
      reports,
      typeFilter,
      animalFilter,
      lifecycleFilter,
    );

    if (ownershipFilter === "mine" && user?.id) {
      filtered = filtered.filter((r) =>
        isOwner(user.id, r.owner_user_id),
      );
    }

    return sortReportsNewestFirst(filtered);
  }, [
    reports,
    typeFilter,
    animalFilter,
    lifecycleFilter,
    ownershipFilter,
    user?.id,
  ]);

  const hasAnyFeedReports = reports.some(isPublicFeedReport);
  const showMyReportsEmpty =
    ownershipFilter === "mine" &&
    !loading &&
    hasAnyFeedReports &&
    sortedReports.length === 0;

  const emptyLifecycleMessage =
    lifecycleFilter === "resolved"
      ? t("feedEmptyResolved")
      : t("feedEmpty");

  const saveScroll = () => {
    if (scrollRef.current) {
      saveFeedScrollPosition(scrollRef.current.scrollTop);
    }
  };

  useEffect(() => {
    if (loading || sortedReports.length === 0) return;

    const top = readAndClearFeedScrollPosition();
    if (top == null || !scrollRef.current) return;

    scrollRef.current.scrollTop = top;
  }, [loading, sortedReports.length]);

  return (
    <div className="flex min-h-[65vh] max-h-[65vh] flex-col overflow-hidden rounded-lg border border-gray-800/80 bg-gray-950/40">
      <div className="flex shrink-0 flex-col gap-2 border-b border-gray-800/80 px-3 py-2.5">
        <div
          className="flex justify-center gap-2"
          role="group"
          aria-label={t("feedFilterActive")}
        >
          {(["active", "resolved", "all"] as const).map((lifecycle) => {
            const isActive = lifecycleFilter === lifecycle;
            const labelKey =
              lifecycle === "active"
                ? "feedFilterActive"
                : lifecycle === "resolved"
                  ? "feedFilterResolved"
                  : "feedFilterAll";
            return (
              <button
                key={lifecycle}
                type="button"
                onClick={() => setLifecycleFilter(lifecycle)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "bg-gray-900 text-gray-400 hover:text-gray-200"
                }`}
                aria-pressed={isActive}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
        <div
          className="flex justify-center gap-2"
          role="group"
          aria-label={t("feedOwnershipMine")}
        >
          {(["all", "mine"] as const).map((scope) => {
            const isActive = ownershipFilter === scope;
            return (
              <button
                key={scope}
                type="button"
                onClick={() => setOwnershipFilter(scope)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "bg-gray-900 text-gray-400 hover:text-gray-200"
                }`}
                aria-pressed={isActive}
              >
                {scope === "all"
                  ? t("feedOwnershipAll")
                  : t("feedOwnershipMine")}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
          <p className="mb-4 text-center text-sm text-gray-500" role="status">
            {t("feedLoading")}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
            <FeedSkeleton />
          </div>
        </div>
      ) : !hasAnyFeedReports ? (
        <div
          className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
          role="status"
        >
          <p className="text-base font-medium text-gray-300">
            {t("feedEmptyArea")}
          </p>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            {t("feedEmptyHint")}
          </p>
        </div>
      ) : showMyReportsEmpty ? (
        <div
          className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
          role="status"
        >
          <p className="text-sm text-gray-400">
            {user?.id
              ? t("feedEmptyMyReports")
              : t("feedEmptyMyReportsLogin")}
          </p>
        </div>
      ) : sortedReports.length === 0 ? (
        <div
          className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
          role="status"
        >
          <p className="text-sm text-gray-400">{emptyLifecycleMessage}</p>
        </div>
      ) : (
        <ul
          ref={scrollRef}
          className="mx-auto min-h-0 w-full max-w-lg flex-1 space-y-5 overflow-y-auto overscroll-contain px-2 py-4 touch-pan-y md:max-w-xl md:space-y-4 md:py-3 xl:space-y-3.5"
        >
          {sortedReports.map((report) => (
            <li key={report.id}>
              <ReportFeedCard
                report={report}
                onBeforeNavigate={saveScroll}
                emphasizeOwned={ownershipFilter === "mine"}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

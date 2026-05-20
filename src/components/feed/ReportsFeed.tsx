"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  readAndClearFeedScrollPosition,
  reportDetailHref,
  saveFeedScrollPosition,
} from "@/src/lib/reportNavigation";
import { useReports, type Report } from "../report/useReports";
import { filterReports } from "../map/filters";
import type { AnimalFilter, TypeFilter } from "../report/ReportFiltersBar";
import {
  formatReportLocation,
  truncateText,
} from "@/src/lib/adminReports";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

const ANIMAL_LABEL_KEYS: Record<Report["animal_type"], TranslationKey> = {
  dog: "animalDog",
  cat: "animalCat",
  bird: "animalBird",
  rodent: "animalRodent",
  other: "animalOther",
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
    <ul className="space-y-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="flex animate-pulse gap-3 rounded-lg border border-gray-800 bg-gray-900/60 p-3"
        >
          <div className="h-16 w-16 shrink-0 rounded-md bg-gray-800" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-4 w-2/3 rounded bg-gray-800" />
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
}: {
  report: Report;
  onBeforeNavigate: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [photoBroken, setPhotoBroken] = useState(false);
  const isOwner =
    !!user?.id &&
    !!report.owner_user_id &&
    user.id === report.owner_user_id;
  const location = formatReportLocation(report.latitude, report.longitude);
  const description =
    report.description?.trim() || t("adminNoDescription");
  const typeLabel =
    report.type === "lost" ? t("reportLost") : t("reportFound");
  return (
    <Link
      href={reportDetailHref(report.id, "feed")}
      onClick={onBeforeNavigate}
      className="flex w-full cursor-pointer gap-3 rounded-lg border border-gray-700 bg-gray-900 p-3.5 text-left transition-colors hover:border-gray-600 hover:bg-gray-800/80 active:bg-gray-800"
    >
      {report.photo_url && !photoBroken ? (
        <img
          src={report.photo_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-16 w-16 shrink-0 rounded-md border border-gray-600 object-cover"
          onError={() => setPhotoBroken(true)}
        />
      ) : (
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-xs text-gray-500"
          aria-hidden
        >
          —
        </div>
      )}

      <div className="min-w-0 flex-1">
        {isOwner ? (
          <span className="mb-1.5 inline-block rounded-full border border-sky-800/50 bg-sky-950/40 px-2 py-0.5 text-xs font-medium text-sky-200/90">
            {t("reportYourReport")}
          </span>
        ) : null}
        <p className="font-semibold capitalize text-white">
          {t(ANIMAL_LABEL_KEYS[report.animal_type])}
          <span className="ml-2 text-sm font-normal text-gray-400">
            · {typeLabel}
          </span>
          {report.animal_name ? (
            <span className="ml-1 text-sm font-normal text-gray-300">
              ({report.animal_name})
            </span>
          ) : null}
        </p>

        {location ? (
          <p className="mt-1 text-xs text-gray-400">
            {t("adminLocation")}: {location}
          </p>
        ) : null}

        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          {truncateText(description, 120)}
        </p>
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
  const scrollRef = useRef<HTMLUListElement>(null);

  const sortedReports = useMemo(() => {
    const filtered = filterReports(reports, typeFilter, animalFilter);
    return sortReportsNewestFirst(filtered);
  }, [reports, typeFilter, animalFilter]);

  const hasAnyReports = reports.length > 0;

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
      {loading ? (
        <div className="flex min-h-0 flex-1 flex-col px-1 py-3">
          <p className="mb-4 text-center text-sm text-gray-500" role="status">
            {t("feedLoading")}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
            <FeedSkeleton />
          </div>
        </div>
      ) : !hasAnyReports ? (
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
      ) : sortedReports.length === 0 ? (
        <div
          className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
          role="status"
        >
          <p className="text-sm text-gray-400">{t("feedEmpty")}</p>
        </div>
      ) : (
        <ul
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 py-3 pr-2 touch-pan-y"
        >
          {sortedReports.map((report) => (
            <li key={report.id}>
              <ReportFeedCard
                report={report}
                onBeforeNavigate={saveScroll}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

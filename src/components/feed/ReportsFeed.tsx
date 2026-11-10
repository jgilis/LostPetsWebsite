"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { homeDestinationHref } from "@/src/lib/homeDestination";
import {
  activityEventFocusHref,
  readAndClearFeedScrollPosition,
  saveFeedScrollPosition,
} from "@/src/lib/reportNavigation";
import { formatReportTimestampDisplay } from "@/src/lib/reportTimestamps";
import { isPublicFeedReport, type Report } from "@/src/lib/reports";
import type { MapBoundsBox } from "@/src/lib/geo/reportInBounds";
import type { AnimalFilter } from "../report/ReportFiltersBar";
import { truncateText } from "@/src/lib/adminReports";
import LocationDisplay from "@/src/components/location/LocationDisplay";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { isOwner } from "@/src/lib/permissions";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";
import type { Sighting } from "@/src/lib/sightings";
import DiscoverDetailSheet from "../discover/DiscoverDetailSheet";
import ActivityToolbar from "./ActivityToolbar";
import {
  buildActivityEvents,
  type ActivityEventType,
  type ActivityOwnershipFilter,
} from "./activityEvents";
import { useApprovedSightings } from "./useApprovedSightings";

type OwnershipFilter = ActivityOwnershipFilter;

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

type ReportsFeedProps = {
  animalFilter: AnimalFilter;
  reports: Report[];
  bounds: MapBoundsBox | null;
  loading?: boolean;
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
  onOpen,
  emphasizeOwned,
}: {
  report: Report;
  onOpen: () => void;
  emphasizeOwned: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [photoBroken, setPhotoBroken] = useState(false);
  const reportIsOwner = isOwner(user?.id, report.owner_user_id);
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
    <button
      type="button"
      onClick={onOpen}
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
          <LocationDisplay
            latitude={report.latitude}
            longitude={report.longitude}
          />
          {reportedAt ? (
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
    </button>
  );
}

function SightingFeedCard({
  sighting,
  report,
  onOpen,
}: {
  sighting: Sighting;
  report: Report;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const [photoBroken, setPhotoBroken] = useState(false);
  const seenAt = formatReportTimestampDisplay({
    created_at: sighting.created_at,
  });
  const description = sighting.description?.trim();
  const photoUrl = report.photo_url?.trim() || null;
  const hasPhoto = !!photoUrl && !photoBroken;
  const placeholder = ANIMAL_PLACEHOLDER[report.animal_type];
  const title = report.animal_name?.trim()
    ? report.animal_name
    : t(ANIMAL_LABEL_KEYS[report.animal_type]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full overflow-hidden rounded-xl border border-amber-900/40 bg-gray-900/80 text-left shadow-sm transition-colors hover:border-amber-800/60 hover:bg-gray-900 active:bg-gray-800/90"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900 md:aspect-[16/10] xl:aspect-[18/10]">
        {hasPhoto ? (
          <img
            src={photoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
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

        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1.5 p-2.5 md:p-2">
          <span className="rounded-full border border-amber-800/40 bg-amber-950/75 px-2 py-0.5 text-xs font-medium text-amber-100/95 backdrop-blur-sm">
            {t("activitySighting")}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-3 pt-10 md:px-3 md:pb-2.5 md:pt-8">
          <p className="text-lg font-semibold leading-tight text-white drop-shadow-sm md:text-base">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-gray-200/90 md:text-xs">
            {t(ANIMAL_LABEL_KEYS[report.animal_type])} · {t("activitySighting")}
          </p>
        </div>
      </div>

      <div className="space-y-2 px-3.5 py-3 md:space-y-1.5 md:px-3 md:py-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 md:text-[11px] md:leading-snug">
          <span>{t("activitySightingNearby")}</span>
          <LocationDisplay
            latitude={report.latitude}
            longitude={report.longitude}
          />
          {seenAt ? (
            <span className="text-gray-600" aria-hidden>
              ·
            </span>
          ) : null}
          {seenAt ? <time className="text-gray-500">{seenAt}</time> : null}
        </div>

        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-400/95 md:text-xs md:leading-snug">
            {truncateText(description, 100)}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export default function ReportsFeed({
  animalFilter,
  reports,
  bounds,
  loading = false,
}: ReportsFeedProps) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const scrollRef = useRef<HTMLUListElement>(null);
  const { sightings, loading: sightingsLoading } = useApprovedSightings();
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>("all");
  const [eventType, setEventType] = useState<ActivityEventType>("all");
  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const waiting = loading || sightingsLoading;

  const events = useMemo(
    () =>
      buildActivityEvents({
        reports,
        sightings,
        bounds,
        animalFilter,
        eventType,
        ownershipFilter,
        userId: user?.id,
      }),
    [
      reports,
      sightings,
      bounds,
      animalFilter,
      eventType,
      ownershipFilter,
      user?.id,
    ],
  );

  const hasAnyFeedReports = reports.some(isPublicFeedReport);
  const hasAnyActivity = hasAnyFeedReports || sightings.length > 0;
  const showMyReportsEmpty =
    ownershipFilter === "mine" &&
    !waiting &&
    hasAnyActivity &&
    events.length === 0;

  const areaEmptyTitle =
    eventType === "all"
      ? t("activityEmptyInArea")
      : eventType === "reunited"
        ? t("feedEmptyResolved")
        : t("feedEmpty");
  const openReport =
    openReportId == null
      ? null
      : (reports.find((report) => report.id === openReportId) ??
        events.find((event) => event.report.id === openReportId)?.report ??
        null);

  const saveScroll = () => {
    if (scrollRef.current) {
      saveFeedScrollPosition(scrollRef.current.scrollTop);
    }
  };

  useEffect(() => {
    if (waiting || events.length === 0) return;

    const top = readAndClearFeedScrollPosition();
    if (top == null || !scrollRef.current) return;

    scrollRef.current.scrollTop = top;
  }, [waiting, events.length]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-800/80 bg-gray-950/40">
      <ActivityToolbar
        eventType={eventType}
        onEventTypeChange={setEventType}
        ownershipFilter={ownershipFilter}
        onOwnershipFilterChange={setOwnershipFilter}
      />

      {waiting ? (
        <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
          <p className="mb-4 text-center text-sm text-gray-500" role="status">
            {t("feedLoading")}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
            <FeedSkeleton />
          </div>
        </div>
      ) : !hasAnyActivity ? (
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
      ) : events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div role="status">
            <p className="text-base font-medium text-gray-300">
              {areaEmptyTitle}
            </p>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              {t("activityEmptyInAreaHint")}
            </p>
          </div>
          <Link
            href={homeDestinationHref("discover")}
            scroll={false}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-gray-600 bg-gray-900 px-4 text-sm font-medium text-gray-100 hover:border-gray-500"
          >
            {t("activityEmptyOpenDiscover")}
          </Link>
        </div>
      ) : (
        <ul
          ref={scrollRef}
          className="mx-auto min-h-0 w-full max-w-lg flex-1 space-y-5 overflow-y-auto overscroll-contain px-2 py-4 touch-pan-y md:max-w-xl md:space-y-4 md:py-3 xl:space-y-3.5"
        >
          {events.map((event) => (
            <li key={`${event.kind}-${event.id}`}>
              {event.kind === "report" ? (
                <ReportFeedCard
                  report={event.report}
                  onOpen={() => setOpenReportId(event.report.id)}
                  emphasizeOwned={ownershipFilter === "mine"}
                />
              ) : (
                <SightingFeedCard
                  sighting={event.sighting}
                  report={event.report}
                  onOpen={() => setOpenReportId(event.report.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {openReport ? (
        <DiscoverDetailSheet
          key={openReport.id}
          report={openReport}
          onClose={() => setOpenReportId(null)}
          discoverHref={activityEventFocusHref(openReport.id)}
          onDiscoverNavigate={saveScroll}
        />
      ) : null}
    </div>
  );
}

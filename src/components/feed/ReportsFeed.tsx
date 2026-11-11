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
import SpeciesGlyph from "@/src/components/icons/SpeciesGlyph";

type OwnershipFilter = ActivityOwnershipFilter;

const ANIMAL_LABEL_KEYS: Record<Report["animal_type"], TranslationKey> = {
  dog: "animalDog",
  cat: "animalCat",
  bird: "animalBird",
  rodent: "animalRodent",
  other: "animalOther",
};

const ANIMAL_PLACEHOLDER: Record<Report["animal_type"], string> = {
  dog: "from-[#f6e4de] via-[#fffbf6] to-[#efe6d8]",
  cat: "from-[#f6ebc8] via-[#fffbf6] to-[#efe6d8]",
  bird: "from-[#e4ede4] via-[#fffbf6] to-[#efe6d8]",
  rodent: "from-[#f3e6df] via-[#fffbf6] to-[#efe6d8]",
  other: "from-[#efe6d8] via-[#fffbf6] to-[#e4d5c3]",
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
          className="animate-pulse overflow-hidden rounded-2xl border border-lp-line bg-lp-paper"
        >
          <div className="aspect-[4/3] w-full bg-lp-paper-muted md:aspect-[16/10] xl:aspect-[18/10]" />
          <div className="space-y-2 p-4 md:space-y-1.5 md:p-3">
            <div className="h-5 w-2/3 rounded bg-lp-line" />
            <div className="h-3 w-1/2 rounded bg-lp-line/80" />
            <div className="h-3 w-full rounded bg-lp-line/60" />
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
  const statusBadge =
    report.type === "lost"
      ? "border-lp-coral/30 bg-lp-coral-soft text-lp-coral"
      : "border-lp-teal/30 bg-lp-teal-soft text-lp-teal";

  const borderClass =
    emphasizeOwned && reportIsOwner
      ? "border-lp-sage/50"
      : isResolved
        ? "border-lp-teal/40"
        : "border-lp-line";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group block w-full overflow-hidden rounded-2xl border bg-lp-paper text-left shadow-[0_8px_24px_rgb(61_52_44_/_0.06)] transition-colors hover:border-lp-line-strong ${borderClass}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-lp-paper-muted md:aspect-[16/10] xl:aspect-[18/10]">
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
            className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${placeholder} px-6 text-center`}
            aria-hidden
          >
            <SpeciesGlyph animalType={report.animal_type} size={56} />
            <span className="mt-2 text-xs font-medium tracking-wide text-lp-ink-subtle">
              {t("feedNoPhoto")}
            </span>
          </div>
        )}

        {isResolved ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-lp-teal/20 via-transparent to-lp-sage-soft/20"
            aria-hidden
          />
        ) : null}

        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1.5 p-2.5 md:p-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${statusBadge}`}>
            <SpeciesGlyph animalType={report.animal_type} size={12} />
            {typeLabel}
          </span>
          {isResolved ? (
            <span className="rounded-full border border-lp-teal/30 bg-lp-teal-soft px-2 py-0.5 text-xs font-medium text-lp-teal backdrop-blur-sm">
              {t("reportResolved")}
            </span>
          ) : null}
          {reportIsOwner ? (
            <span className="rounded-full border border-lp-sage/30 bg-lp-sage-soft px-2 py-0.5 text-xs font-medium text-lp-sage-dark backdrop-blur-sm">
              {t("reportYourReport")}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-lp-ink/70 via-lp-ink/20 to-transparent px-3 pb-3 pt-10 md:px-3 md:pb-2.5 md:pt-8">
          <p className="text-lg font-semibold leading-tight text-white drop-shadow-sm md:text-base">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-white/85 md:text-xs">
            {t(ANIMAL_LABEL_KEYS[report.animal_type])}
          </p>
        </div>
      </div>

      <div className="space-y-2 px-3.5 py-3 md:space-y-1.5 md:px-3 md:py-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-lp-ink-subtle md:text-[11px] md:leading-snug">
          <LocationDisplay
            latitude={report.latitude}
            longitude={report.longitude}
          />
          {reportedAt ? (
            <span className="text-lp-line-strong" aria-hidden>
              ·
            </span>
          ) : null}
          {reportedAt ? (
            <time className="text-lp-ink-subtle">{reportedAt}</time>
          ) : null}
        </div>

        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-lp-ink-muted md:text-xs md:leading-snug">
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
      className="group block w-full overflow-hidden rounded-2xl border border-lp-gold/50 bg-lp-paper text-left shadow-[0_8px_24px_rgb(61_52_44_/_0.06)] transition-colors hover:border-lp-gold"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-lp-paper-muted md:aspect-[16/10] xl:aspect-[18/10]">
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
            className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${placeholder} px-6 text-center`}
            aria-hidden
          >
            <SpeciesGlyph animalType={report.animal_type} size={56} />
            <span className="mt-2 text-xs font-medium tracking-wide text-lp-ink-subtle">
              {t("feedNoPhoto")}
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1.5 p-2.5 md:p-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-lp-gold/40 bg-lp-gold-soft px-2 py-0.5 text-xs font-medium text-lp-ink backdrop-blur-sm">
            <SpeciesGlyph animalType={report.animal_type} size={12} />
            {t("activitySighting")}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-lp-ink/70 via-lp-ink/20 to-transparent px-3 pb-3 pt-10 md:px-3 md:pb-2.5 md:pt-8">
          <p className="text-lg font-semibold leading-tight text-white drop-shadow-sm md:text-base">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-white/85 md:text-xs">
            {t(ANIMAL_LABEL_KEYS[report.animal_type])}
          </p>
        </div>
      </div>

      <div className="space-y-2 px-3.5 py-3 md:space-y-1.5 md:px-3 md:py-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-lp-ink-subtle md:text-[11px] md:leading-snug">
          <span>{t("activitySightingNearby")}</span>
          <LocationDisplay
            latitude={report.latitude}
            longitude={report.longitude}
          />
          {seenAt ? (
            <span className="text-lp-line-strong" aria-hidden>
              ·
            </span>
          ) : null}
          {seenAt ? <time className="text-lp-ink-subtle">{seenAt}</time> : null}
        </div>

        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-lp-ink-muted md:text-xs md:leading-snug">
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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-lp-line bg-lp-paper/70">
      <ActivityToolbar
        eventType={eventType}
        onEventTypeChange={setEventType}
        ownershipFilter={ownershipFilter}
        onOwnershipFilterChange={setOwnershipFilter}
      />

      {waiting ? (
        <div className="flex min-h-0 flex-1 flex-col px-2 py-3">
          <p className="mb-4 text-center text-sm text-lp-ink-subtle" role="status">
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
          <p className="text-base font-medium text-lp-ink">
            {t("feedEmptyArea")}
          </p>
          <p className="mt-2 max-w-sm text-sm text-lp-ink-muted">
            {t("feedEmptyHint")}
          </p>
        </div>
      ) : showMyReportsEmpty ? (
        <div
          className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
          role="status"
        >
          <p className="text-sm text-lp-ink-muted">
            {user?.id
              ? t("feedEmptyMyReports")
              : t("feedEmptyMyReportsLogin")}
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div role="status">
            <p className="text-base font-medium text-lp-ink">
              {areaEmptyTitle}
            </p>
            <p className="mt-2 max-w-sm text-sm text-lp-ink-muted">
              {t("activityEmptyInAreaHint")}
            </p>
          </div>
          <Link
            href={homeDestinationHref("discover")}
            scroll={false}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-lp-line bg-lp-paper px-4 text-sm font-medium text-lp-ink hover:border-lp-sage"
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

import { isOwner } from "@/src/lib/permissions";
import {
  filterReportsInBounds,
  reportInBounds,
  type MapBoundsBox,
} from "@/src/lib/geo/reportInBounds";
import type { Report } from "@/src/lib/reports";
import type { Sighting } from "@/src/lib/sightings";
import {
  filterFeedReports,
  type FeedLifecycleFilter,
} from "../map/filters";
import type { AnimalFilter, TypeFilter } from "../report/ReportFiltersBar";

export type ActivityOwnershipFilter = "all" | "mine";

export type ActivityEventType =
  | "all"
  | "missing"
  | "found"
  | "sightings"
  | "reunited";

export type ActivityEvent =
  | { kind: "report"; id: string; sortAt: number; report: Report }
  | {
      kind: "sighting";
      id: string;
      sortAt: number;
      sighting: Sighting;
      report: Report;
    };

export const ACTIVITY_REUNION_VISIBLE_MS = 14 * 24 * 60 * 60 * 1000;

function eventTime(iso: string | null | undefined): number {
  if (!iso) return 0;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function reunionEventTime(report: Report): number {
  return (
    eventTime(report.resolved_at) ||
    eventTime(report.date_reported ?? report.created_at)
  );
}

export function isRecentActivityReunion(
  report: Report,
  now = Date.now(),
): boolean {
  if (report.status !== "resolved") return false;
  const at = eventTime(report.resolved_at);
  if (!at) return false;
  const age = now - at;
  return age >= 0 && age <= ACTIVITY_REUNION_VISIBLE_MS;
}

function reportIsPublicActivityParent(report: Report): boolean {
  return (
    report.type === "lost" &&
    report.status !== "flagged" &&
    report.status !== "removed" &&
    report.status !== "expired"
  );
}

/**
 * Public sighting rows have no coordinates (Phase 0 column grant).
 * Area tests therefore use the linked lost report's public point.
 */
function sightingInDiscoverArea(
  report: Report,
  bounds: MapBoundsBox | null,
): boolean {
  return bounds != null && reportInBounds(report, bounds);
}

function reportTypeForEvent(eventType: ActivityEventType): TypeFilter {
  if (eventType === "missing") return "lost";
  if (eventType === "found") return "found";
  return "all";
}

function lifecycleForEvent(eventType: ActivityEventType): FeedLifecycleFilter {
  if (eventType === "reunited") return "resolved";
  if (eventType === "all") return "all";
  return "active";
}

export function buildActivityEvents({
  reports,
  sightings,
  bounds,
  animalFilter,
  eventType,
  ownershipFilter,
  userId,
}: {
  reports: Report[];
  sightings: Sighting[];
  bounds: MapBoundsBox | null;
  animalFilter: AnimalFilter;
  eventType: ActivityEventType;
  ownershipFilter: ActivityOwnershipFilter;
  userId: string | null | undefined;
}): ActivityEvent[] {
  const includeReports = eventType !== "sightings";
  const includeSightings = eventType === "all" || eventType === "sightings";

  let visibleReports = includeReports
    ? filterFeedReports(
        reports,
        reportTypeForEvent(eventType),
        animalFilter,
        lifecycleForEvent(eventType),
      )
    : [];

  if (ownershipFilter === "mine") {
    visibleReports = userId
      ? visibleReports.filter((report) => isOwner(userId, report.owner_user_id))
      : [];
  } else {
    visibleReports = filterReportsInBounds(visibleReports, bounds).filter(
      (report) =>
        report.status !== "resolved" || isRecentActivityReunion(report),
    );
  }

  const reportEvents: ActivityEvent[] = visibleReports.map((report) => ({
    kind: "report",
    id: report.id,
    sortAt:
      report.status === "resolved"
        ? reunionEventTime(report)
        : eventTime(report.date_reported ?? report.created_at),
    report,
  }));

  const reportsById = new Map(reports.map((report) => [report.id, report]));
  const sightingEvents: ActivityEvent[] = [];
  if (includeSightings) {
    for (const sighting of sightings) {
      if (sighting.status !== "approved") continue;

      const report = reportsById.get(sighting.lost_report_id);
      if (!report || !reportIsPublicActivityParent(report)) continue;
      if (report.status !== "active") continue;
      if (animalFilter !== "all" && report.animal_type !== animalFilter) {
        continue;
      }

      if (ownershipFilter === "mine") {
        if (!userId || !isOwner(userId, report.owner_user_id)) continue;
      } else if (!sightingInDiscoverArea(report, bounds)) {
        continue;
      }

      sightingEvents.push({
        kind: "sighting",
        id: sighting.id,
        sortAt: eventTime(sighting.created_at),
        sighting,
        report,
      });
    }
  }

  return [...reportEvents, ...sightingEvents].sort(
    (left, right) => right.sortAt - left.sortAt,
  );
}

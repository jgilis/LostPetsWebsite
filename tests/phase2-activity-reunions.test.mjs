import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const activityEvents = readFileSync(
  "src/components/feed/activityEvents.ts",
  "utf8",
);
const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const filters = readFileSync("src/components/map/filters.ts", "utf8");
const pane = readFileSync(
  "src/components/discover/DiscoverReportsPane.tsx",
  "utf8",
);
const reports = readFileSync("src/lib/reports.ts", "utf8");
const publicSelect = reports.slice(
  reports.indexOf("export const REPORT_PUBLIC_SELECT"),
  reports.indexOf("export const REPORT_ADMIN_SELECT"),
);

test("mixed Activity includes 14-day reunions with missing, found, and sightings", () => {
  assert.match(activityEvents, /ACTIVITY_REUNION_VISIBLE_MS = 14 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(activityEvents, /isRecentActivityReunion/);
  assert.match(activityEvents, /eventType === "all"\) return "all"/);
  assert.match(activityEvents, /includeSightings = eventType === "all" \|\| eventType === "sightings"/);
  assert.match(feed, /eventType/);
});

test("area reunions leave Activity after 14 days; Mine keeps the owner's resolved reports", () => {
  assert.match(
    activityEvents,
    /report\.status !== "resolved" \|\| isRecentActivityReunion\(report\)/,
  );
  const mineBlock = activityEvents.slice(
    activityEvents.indexOf('if (ownershipFilter === "mine")'),
    activityEvents.indexOf("filterReportsInBounds(visibleReports, bounds)"),
  );
  assert.match(mineBlock, /ownershipFilter === "mine"/);
  assert.doesNotMatch(mineBlock, /isRecentActivityReunion/);
});

test("Type Reunited isolates resolved reports and still hides flagged, removed, expired, pending, and rejected", () => {
  assert.match(activityEvents, /eventType === "reunited"\) return "resolved"/);
  assert.match(filters, /r\.status === "flagged"/);
  assert.match(filters, /r\.status === "removed"/);
  assert.match(filters, /r\.status === "expired"/);
  assert.match(activityEvents, /sighting\.status !== "approved"/);
  assert.doesNotMatch(activityEvents, /pending/);
  assert.doesNotMatch(activityEvents, /rejected/);
});

test("Activity 14-day reunions use resolved_at and do not add an activity table", () => {
  assert.match(publicSelect, /resolved_at/);
  assert.doesNotMatch(publicSelect, /updated_at/);
  assert.match(activityEvents, /eventTime\(report\.resolved_at\)/);
  assert.doesNotMatch(activityEvents, /activity table/i);
  assert.doesNotMatch(feed, /from\("activity"\)/);
});

test("Discover map and list stay reports-only and do not show reunions", () => {
  assert.match(filters, /if \(r\.status !== "active"\) return false/);
  assert.match(map, /filterReports\(/);
  assert.match(map, /isPublicMapReport/);
  assert.doesNotMatch(pane, /isRecentActivityReunion/);
  assert.doesNotMatch(pane, /eventType === "reunited"/);
  assert.doesNotMatch(map, /isRecentActivityReunion/);
});

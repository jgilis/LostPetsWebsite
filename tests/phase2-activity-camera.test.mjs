import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const workspace = readFileSync(
  "src/components/discover/DiscoverWorkspace.tsx",
  "utf8",
);
const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const activityEvents = readFileSync(
  "src/components/feed/activityEvents.ts",
  "utf8",
);
const bounds = readFileSync("src/lib/geo/reportInBounds.ts", "utf8");
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

test("the Discover map stays mounted when Activity or Help is open", () => {
  assert.match(home, /DiscoverWorkspace/);
  assert.match(home, /onViewChange=\{setDiscoverView\}/);
  assert.match(home, /inert=\{!showDiscover \? true : undefined\}/);
  assert.match(home, /absolute inset-0 z-\[545\]/);
  assert.match(workspace, /onViewChange\?:/);
  assert.match(workspace, /DiscoverDetailSheet/);
});

test("Activity lists loaded reports in Discover bounds and Mine ignores the area", () => {
  assert.match(feed, /buildActivityEvents/);
  assert.match(activityEvents, /filterReportsInBounds/);
  assert.match(feed, /ownershipFilter === "mine"/);
  assert.match(feed, /ActivityToolbar/);
  assert.match(feed, /activityEmptyInArea/);
  assert.match(feed, /activityEmptyInAreaHint/);
  assert.match(feed, /activityEmptyOpenDiscover/);
  assert.match(feed, /homeDestinationHref\("discover"\)/);
  assert.doesNotMatch(feed, /useReports\(/);
  assert.doesNotMatch(feed, /bounding.?box query/i);
  assert.doesNotMatch(feed, /fitBounds|setZoom|flyTo|setView/);
  assert.match(home, /reports=\{discoverView.reports\}/);
  assert.match(home, /bounds=\{discoverView.bounds\}/);
  assert.match(bounds, /report\.latitude >= south/);
  assert.match(en, /activityEmptyInArea: "No recent activity here."/);
  assert.match(
    en,
    /activityEmptyInAreaHint: "Zoom out to see activity in a wider area."/,
  );
  assert.match(nl, /activityEmptyInArea: "Geen recente activiteit hier."/);
  assert.match(fr, /activityEmptyInArea: "Aucune activité récente ici."/);
});

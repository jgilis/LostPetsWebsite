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
const pane = readFileSync(
  "src/components/discover/DiscoverReportsPane.tsx",
  "utf8",
);

test("the Discover map stays mounted when Activity or Report is open", () => {
  assert.match(home, /DiscoverWorkspace/);
  assert.match(home, /onViewChange=\{setDiscoverView\}/);
  assert.match(home, /inert=\{!showDiscover \? true : undefined\}/);
  assert.match(home, /absolute inset-0 z-\[545\]/);
  assert.match(workspace, /DiscoverDetailSheet/);
  assert.doesNotMatch(pane, /useApprovedSightings/);
  assert.doesNotMatch(pane, /isRecentActivityReunion/);
});

test("Activity lists loaded reports in Discover bounds and Mine ignores the area", () => {
  assert.match(feed, /buildActivityEvents/);
  assert.match(activityEvents, /filterReportsInBounds/);
  assert.match(feed, /ownershipFilter === "mine"/);
  assert.match(activityEvents, /ownershipFilter === "mine"/);
  assert.match(feed, /activityEmptyInArea/);
  assert.match(feed, /homeDestinationHref\("discover"\)/);
  assert.doesNotMatch(feed, /useReports\(/);
  assert.doesNotMatch(feed, /fitBounds|setZoom|flyTo|setView/);
  assert.match(home, /reports=\{discoverView.reports\}/);
  assert.match(home, /bounds=\{discoverView.bounds\}/);
});

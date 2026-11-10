import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const toolbar = readFileSync(
  "src/components/feed/ActivityToolbar.tsx",
  "utf8",
);
const activityEvents = readFileSync(
  "src/components/feed/activityEvents.ts",
  "utf8",
);

test("Activity uses a Type control and drops Discover chip rows", () => {
  assert.doesNotMatch(home, /<ReportFiltersBar/);
  assert.doesNotMatch(feed, /feedFilterActive/);
  assert.doesNotMatch(feed, /typeFilter/);
  assert.match(feed, /ActivityToolbar/);
  assert.match(toolbar, /activity-type-sheet/);
  assert.match(toolbar, /md:hidden/);
  assert.match(toolbar, /activityAreaScope/);
  assert.match(toolbar, /feedOwnershipMine/);
  assert.doesNotMatch(toolbar, /Walking Mode/);
  assert.doesNotMatch(toolbar, /discoverWithin500m/);
  assert.match(activityEvents, /eventType === "sightings"/);
  assert.match(activityEvents, /eventType === "missing"/);
  assert.match(activityEvents, /eventType === "found"/);
  assert.match(activityEvents, /eventType === "reunited"\) return "resolved"/);
});

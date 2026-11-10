import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const activityEvents = readFileSync(
  "src/components/feed/activityEvents.ts",
  "utf8",
);
const hook = readFileSync(
  "src/components/feed/useApprovedSightings.ts",
  "utf8",
);
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const workspace = readFileSync(
  "src/components/discover/DiscoverWorkspace.tsx",
  "utf8",
);

test("Activity mixes approved sightings with a coarse place, not exact coordinates", () => {
  assert.match(feed, /useApprovedSightings/);
  assert.match(feed, /buildActivityEvents/);
  assert.match(hook, /getApprovedSightings\(\)/);
  assert.match(activityEvents, /sightingInDiscoverArea/);
  assert.match(activityEvents, /reportInBounds\(report, bounds\)/);
  assert.match(feed, /activitySightingNearby/);
  assert.match(feed, /latitude=\{report\.latitude\}/);
  assert.doesNotMatch(feed, /sighting\.latitude/);
  assert.doesNotMatch(feed, /sighting\.photo_url/);
  assert.doesNotMatch(hook, /withExactCoordinates/);
  assert.doesNotMatch(feed, /\/sightings\//);
  assert.doesNotMatch(workspace, /useApprovedSightings/);
  assert.doesNotMatch(map, /useApprovedSightings/);
});

test("pending and rejected sightings stay out of Activity", () => {
  assert.match(activityEvents, /sighting\.status !== "approved"/);
  assert.doesNotMatch(activityEvents, /pending/);
  assert.doesNotMatch(activityEvents, /rejected/);
});

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
const sightings = readFileSync("src/lib/sightings.ts", "utf8");
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const workspace = readFileSync(
  "src/components/discover/DiscoverWorkspace.tsx",
  "utf8",
);
const pane = readFileSync(
  "src/components/discover/DiscoverReportsPane.tsx",
  "utf8",
);
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

test("Activity mixes approved sightings from the existing public select path", () => {
  assert.match(feed, /useApprovedSightings/);
  assert.match(feed, /buildActivityEvents/);
  assert.match(feed, /SightingFeedCard/);
  assert.match(feed, /event\.kind === "report"/);
  assert.match(hook, /getApprovedSightings\(\)/);
  assert.match(hook, /table: "sightings"/);
  assert.match(sightings, /lostReportId\?: string/);
  assert.match(sightings, /\.eq\("status", "approved"\)/);
  assert.match(sightings, /PUBLIC_SIGHTING_COLUMNS/);
  assert.doesNotMatch(activityEvents, /activity table/i);
});

test("pending and rejected sightings stay out of Activity", () => {
  assert.match(activityEvents, /sighting\.status !== "approved"/);
  assert.match(hook, /getApprovedSightings\(\)/);
  assert.doesNotMatch(activityEvents, /pending/);
  assert.doesNotMatch(activityEvents, /rejected/);
});

test("Activity sightings use the linked report's coarse place, not exact coordinates", () => {
  assert.match(activityEvents, /sightingInDiscoverArea/);
  assert.match(activityEvents, /reportInBounds\(report, bounds\)/);
  assert.match(activityEvents, /Public sighting rows have no coordinates/);
  assert.match(feed, /activitySightingNearby/);
  assert.match(feed, /latitude=\{report\.latitude\}/);
  assert.match(feed, /longitude=\{report\.longitude\}/);
  assert.doesNotMatch(feed, /sighting\.latitude/);
  assert.doesNotMatch(feed, /sighting\.longitude/);
  assert.doesNotMatch(feed, /withExactCoordinates/);
  assert.doesNotMatch(hook, /withExactCoordinates/);
  assert.doesNotMatch(hook, /latitude/);
  const publicColumns = sightings.slice(
    sightings.indexOf("export const PUBLIC_SIGHTING_COLUMNS"),
    sightings.indexOf("export interface Sighting"),
  );
  assert.doesNotMatch(publicColumns, /latitude/);
  assert.doesNotMatch(publicColumns, /longitude/);
});

test("Activity does not send people to /sightings/[id] or put sighting pins on Discover", () => {
  assert.match(feed, /reportDetailHref\(report\.id, "feed"\)/);
  assert.doesNotMatch(feed, /\/sightings\//);
  assert.doesNotMatch(activityEvents, /\/sightings\//);
  assert.doesNotMatch(workspace, /useApprovedSightings/);
  assert.doesNotMatch(pane, /useApprovedSightings/);
  assert.doesNotMatch(pane, /activitySighting/);
  assert.doesNotMatch(map, /useApprovedSightings/);
});

test("Mine still ignores the camera for reports and their approved sightings", () => {
  assert.match(activityEvents, /ownershipFilter === "mine"/);
  assert.match(activityEvents, /isOwner\(userId, report\.owner_user_id\)/);
  const mineBlock = activityEvents.slice(
    activityEvents.indexOf("if (ownershipFilter === \"mine\")"),
  );
  assert.match(mineBlock, /isOwner\(userId, report\.owner_user_id\)/);
});

test("sighting Activity copy exists in English, Dutch, and French", () => {
  assert.match(en, /activitySighting: "Sighting"/);
  assert.match(en, /activitySightingNearby: "Seen nearby"/);
  assert.match(nl, /activitySighting: "Waarneming"/);
  assert.match(nl, /activitySightingNearby: "In de buurt gezien"/);
  assert.match(fr, /activitySighting: "Observation"/);
  assert.match(fr, /activitySightingNearby: "Vu à proximité"/);
});

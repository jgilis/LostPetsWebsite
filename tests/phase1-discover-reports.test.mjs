import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const workspace = readFileSync(
  "src/components/discover/DiscoverWorkspace.tsx",
  "utf8",
);
const pane = readFileSync(
  "src/components/discover/DiscoverReportsPane.tsx",
  "utf8",
);
const card = readFileSync(
  "src/components/discover/DiscoverReportCard.tsx",
  "utf8",
);
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const marker = readFileSync("src/components/map/ReportMarker.tsx", "utf8");
const bounds = readFileSync("src/lib/geo/reportInBounds.ts", "utf8");
const sort = readFileSync("src/lib/geo/sortDiscoverReports.ts", "utf8");

test("Discover reuses the map reports instead of a second subscription", () => {
  assert.match(home, /DiscoverWorkspace/);
  assert.match(workspace, /onDiscoverViewChange/);
  assert.doesNotMatch(workspace, /useReports/);
  assert.doesNotMatch(pane, /useReports/);
});

test("in-view cards filter loaded reports by map bounds", () => {
  assert.match(bounds, /report\.latitude >= south/);
  assert.match(bounds, /report\.longitude >= west/);
  assert.match(pane, /filterReportsInBounds/);
  assert.doesNotMatch(pane, /bounding.?box query/i);
});

test("mobile sheet has three snaps and desktop has a side list", () => {
  assert.match(pane, /collapsed/);
  assert.match(pane, /partial/);
  assert.match(pane, /expanded/);
  assert.match(pane, /discover-reports-desktop/);
  assert.match(pane, /discover-report-sheet/);
});

test("cards and markers stay synchronized; Discover details stay on the map", () => {
  assert.match(map, /selectedReportId/);
  assert.match(map, /onSelectReport/);
  assert.match(marker, /eventHandlers=\{\{ click: handleSelect \}\}/);
  assert.match(pane, /selectedReportId/);
  assert.doesNotMatch(card, /reportDetailHref/);
  assert.match(workspace, /DiscoverDetailSheet/);
});

test("Walking Mode sorts in-view cards by distance", () => {
  assert.match(sort, /getDistanceMeters/);
  assert.match(workspace, /sortOrigin/);
  assert.match(workspace, /isWalkingModeEnabled/);
});

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

test("found dots keep a hittable target and do not treat the tap as a map background click", () => {
  assert.match(marker, /report\.type === "found"/);
  assert.match(marker, /discover-found-marker/);
  assert.match(marker, /DivIcon/);
  assert.match(marker, /iconSize: \[44, 44\]/);
  assert.match(marker, /zIndexOffset=\{1000\}/);
  assert.match(map, /leaflet-marker-icon/);
  assert.match(map, /onBackgroundClick/);
});

test("Walking Mode sorts in-view cards by distance", () => {
  assert.match(sort, /getDistanceMeters/);
  assert.match(workspace, /sortOrigin/);
  assert.match(workspace, /isWalkingModeEnabled/);
});

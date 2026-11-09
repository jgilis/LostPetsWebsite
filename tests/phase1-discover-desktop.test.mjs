import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const pane = readFileSync(
  "src/components/discover/DiscoverReportsPane.tsx",
  "utf8",
);
const toolbar = readFileSync(
  "src/components/discover/DiscoverDesktopToolbar.tsx",
  "utf8",
);
const nearby = readFileSync(
  "src/components/nearby/NearbyAwareness.tsx",
  "utf8",
);
const filters = readFileSync(
  "src/components/report/ReportFiltersBar.tsx",
  "utf8",
);
const css = readFileSync("app/globals.css", "utf8");
const bounds = readFileSync("src/lib/geo/reportInBounds.ts", "utf8");
const en = readFileSync("src/i18n/en.ts", "utf8");

test("desktop Discover hides Walking Mode and does not use a Nearby overlay", () => {
  assert.match(home, /useDesktopLayout/);
  assert.match(home, /stopWalkingMode/);
  assert.match(home, /walking && !isDesktop/);
  assert.doesNotMatch(nearby, /discover-nearby-overlay/);
  assert.doesNotMatch(nearby, /Walking mode off/);
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*--discover-sheet-height: 0px;/);
});

test("desktop Discover uses compact Status, Animal, and Within 500 m menus in the list header", () => {
  assert.match(home, /md:hidden/);
  assert.match(pane, /DiscoverDesktopToolbar/);
  assert.match(toolbar, /discoverFilterStatus/);
  assert.match(toolbar, /discoverFilterAnimal/);
  assert.match(toolbar, /discoverWithin500m/);
  assert.match(toolbar, /filterLost/);
  assert.match(toolbar, /filterFound/);
  assert.match(toolbar, /filterDog/);
  assert.match(toolbar, /filterRodent/);
  assert.match(toolbar, /discoverNearbyMapCentre/);
  assert.match(toolbar, /discoverNearbyMyLocation/);
  assert.doesNotMatch(toolbar, /type="search"/);
  assert.doesNotMatch(pane, /type="search"/);
});

test("Within 500 m reuses loaded reports around the map centre or a chosen location", () => {
  assert.match(pane, /getNearbyReports/);
  assert.match(pane, /DEFAULT_NEARBY_RADIUS_METERS/);
  assert.match(pane, /centerFromBounds/);
  assert.match(pane, /browserGetCurrentPosition/);
  assert.match(bounds, /centerFromBounds/);
  assert.doesNotMatch(pane, /useReports/);
});

test("mobile filters stay quieter in a sheet, and rodent remains a filter", () => {
  assert.match(home, /DiscoverMobileFilters/);
  assert.match(filters, /filterRodent/);
  assert.match(filters, /rounded-full border px-2.5 py-1 text-xs/);
  assert.doesNotMatch(filters, /toUpperCase/);
  assert.doesNotMatch(filters, /border-4/);
  assert.match(en, /discoverWithin500m: "Within 500 m"/);
});

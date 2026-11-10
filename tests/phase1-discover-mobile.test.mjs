import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const pane = readFileSync(
  "src/components/discover/DiscoverReportsPane.tsx",
  "utf8",
);
const filters = readFileSync(
  "src/components/discover/DiscoverMobileFilters.tsx",
  "utf8",
);
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const nearbyControl = readFileSync(
  "src/components/discover/DiscoverSheetNearbyControl.tsx",
  "utf8",
);
const walkingExit = readFileSync(
  "src/components/layout/WalkingModeExitBar.tsx",
  "utf8",
);
const session = readFileSync(
  "src/components/auth/SessionControls.tsx",
  "utf8",
);
const notifications = readFileSync(
  "src/components/notifications/NotificationNavLink.tsx",
  "utf8",
);
const css = readFileSync("app/globals.css", "utf8");

test("Android Discover keeps a compact top bar and opens Status/Animal in a sheet", () => {
  assert.match(home, /DiscoverMobileFilters/);
  assert.match(session, /hidden md:inline/);
  assert.match(notifications, /hidden md:inline/);
  assert.doesNotMatch(home, /<ReportFiltersBar[\s\S]*md:hidden/);
  assert.match(filters, /discover-filter-sheet/);
  assert.match(filters, /ReportFiltersBar/);
  assert.match(filters, /role="dialog"/);
});

test("report sheet defaults to a collapsed handle and count", () => {
  assert.match(pane, /useState<DiscoverSheetSnap>\("collapsed"\)/);
  assert.match(pane, /COLLAPSED_PX = 72/);
  assert.match(pane, /PARTIAL_FRACTION = 0.42/);
  assert.match(pane, /EXPANDED_FRACTION = 0.86/);
  assert.match(css, /--discover-sheet-height: 72px;/);
});

test("Android Nearby lives in the report sheet as Within 500 m, not a map overlay", () => {
  assert.match(pane, /DiscoverSheetNearbyControl/);
  assert.match(nearbyControl, /discoverWithin500m/);
  assert.match(pane, /getNearbyReports/);
  assert.doesNotMatch(map, /overlay/);
  assert.match(map, /discoverWalking/);
  assert.match(walkingExit, /walkingModeExit/);
  assert.match(home, /WalkingModeExitBar/);
});

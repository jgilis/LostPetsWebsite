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
const legend = readFileSync(
  "src/components/map/DiscoverMapLegend.tsx",
  "utf8",
);
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const nearby = readFileSync(
  "src/components/nearby/NearbyAwareness.tsx",
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
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

test("Android Discover keeps a compact top bar and icon Account/Notifications", () => {
  assert.match(home, /DiscoverMobileFilters/);
  assert.match(session, /hidden md:inline/);
  assert.match(session, /aria-label=\{t\("navAccount"\)\}/);
  assert.match(notifications, /aria-label=\{t\("navNotifications"\)\}/);
  assert.match(notifications, /hidden md:inline/);
  assert.doesNotMatch(home, /<ReportFiltersBar[\s\S]*md:hidden/);
});

test("Status and Animal filters open in a mobile sheet instead of two always-visible rows", () => {
  assert.match(filters, /discover-filter-sheet/);
  assert.match(filters, /ReportFiltersBar/);
  assert.match(filters, /role="dialog"/);
  assert.match(filters, /filtersActive/);
  assert.match(en, /discoverFilters: "Filters"/);
  assert.match(nl, /discoverFilters: "Filters"/);
  assert.match(fr, /discoverFilters: "Filtres"/);
});

test("report sheet defaults to a collapsed handle and count", () => {
  assert.match(pane, /useState<DiscoverSheetSnap>\("collapsed"\)/);
  assert.match(pane, /COLLAPSED_PX = 72/);
  assert.match(pane, /PARTIAL_FRACTION = 0.42/);
  assert.match(pane, /EXPANDED_FRACTION = 0.86/);
  assert.match(css, /--discover-sheet-height: 72px;/);
});

test("map legend starts collapsed on phone and stays a small control", () => {
  assert.match(legend, /open=\{isDesktop \? true : mobileOpen\}/);
  assert.match(map, /discover-map-tool-stack/);
  assert.match(map, /md:hidden/);
});

test("Nearby and Walking Mode stay available from compact map controls", () => {
  assert.match(map, /NearbyAwareness/);
  assert.match(map, /discoverWalking/);
  assert.match(nearby, /discoverNearby/);
  assert.match(nearby, /panelOpen/);
  assert.match(walkingExit, /statusLabel/);
  assert.match(walkingExit, /walkingModeExit/);
  assert.match(home, /WalkingModeExitBar/);
  assert.doesNotMatch(nearby, /Walking mode off/);
  assert.match(en, /discoverNearby: "Nearby"/);
  assert.match(en, /discoverWalking: "Walk"/);
});

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
const css = readFileSync("app/globals.css", "utf8");
const bounds = readFileSync("src/lib/geo/reportInBounds.ts", "utf8");

test("desktop Discover hides Walking Mode and does not use a Nearby overlay", () => {
  assert.match(home, /useDesktopLayout/);
  assert.match(home, /stopWalkingMode/);
  assert.match(home, /walking && !isDesktop/);
  assert.doesNotMatch(nearby, /discover-nearby-overlay/);
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*--discover-sheet-height: 0px;/);
});

test("desktop Discover uses compact Status, Animal, and Within 500 m menus in the list header", () => {
  assert.match(pane, /DiscoverDesktopToolbar/);
  assert.match(toolbar, /discoverFilterStatus/);
  assert.match(toolbar, /discoverFilterAnimal/);
  assert.match(toolbar, /discoverWithin500m/);
  assert.match(toolbar, /filterRodent/);
  assert.doesNotMatch(toolbar, /type="search"/);
});

test("Within 500 m reuses loaded reports around the map centre or a chosen location", () => {
  assert.match(pane, /getNearbyReports/);
  assert.match(pane, /centerFromBounds/);
  assert.match(bounds, /centerFromBounds/);
  assert.doesNotMatch(pane, /useReports/);
});

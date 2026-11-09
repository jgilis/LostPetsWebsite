import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const nav = readFileSync(
  "src/components/layout/DiscoverDestinationNav.tsx",
  "utf8",
);
const walkingExit = readFileSync(
  "src/components/layout/WalkingModeExitBar.tsx",
  "utf8",
);
const css = readFileSync("app/globals.css", "utf8");
const destination = readFileSync("src/lib/homeDestination.ts", "utf8");
const back = readFileSync("src/lib/reportNavigation.ts", "utf8");

test("home chrome uses Discover, Activity and Help", () => {
  assert.match(home, /DiscoverDestinationNav/);
  assert.match(nav, /tabDiscover/);
  assert.match(nav, /tabActivity/);
  assert.match(nav, /tabHelp/);
  assert.match(home, /ReportsFeed/);
  assert.match(home, /ReportForm/);
});

test("legacy tab query values still map to destinations", () => {
  assert.match(destination, /tab === "activity" \|\| tab === "feed"/);
  assert.match(destination, /tab === "help" \|\| tab === "report"/);
  assert.match(nav, /homeDestinationHref/);
  assert.match(back, /tab=activity/);
  assert.match(back, /tab=discover/);
});

test("walking mode keeps destination nav and exposes a prominent exit", () => {
  assert.match(walkingExit, /walkingModeExit/);
  assert.match(home, /WalkingModeExitBar/);
  assert.doesNotMatch(css, /walking-mode-active \.discover-nav/);
  assert.doesNotMatch(css, /walking-mode-active \.home-chrome/);
  assert.match(css, /discover-fullbleed footer/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const walking = readFileSync("src/hooks/useWalkingMode.ts", "utf8");
const geo = readFileSync("src/lib/platform/browserGeolocation.ts", "utf8");
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const reports = readFileSync("src/components/report/useReports.ts", "utf8");
const cleanup = readFileSync(
  "src/components/auth/AuthHashCleanup.tsx",
  "utf8",
);
const css = readFileSync("app/globals.css", "utf8");
const home = readFileSync("app/page.tsx", "utf8");
const manifest = readFileSync("public/manifest.json", "utf8");
const sw = readFileSync("public/sw.js", "utf8");
const startWalkingMode = walking.slice(
  walking.indexOf("const startWalkingMode"),
  walking.indexOf("const hasActiveUserLocation"),
);

test("Walk starts GPS from the tap and keeps the watch after a timeout", () => {
  assert.match(startWalkingMode, /startWatch\(session\)/);
  assert.match(startWalkingMode, /browserGetCurrentPosition/);
  assert.doesNotMatch(startWalkingMode, /recoveryInFlightRef\.current\) return/);
  assert.doesNotMatch(startWalkingMode, /stopWalkingMode/);
  assert.match(geo, /WALKING_WATCH_OPTIONS[\s\S]*maximumAge: 5_000,/);
  assert.doesNotMatch(geo, /WALKING_WATCH_OPTIONS[\s\S]*timeout:/);
  assert.match(walking, /Chrome keeps the watch alive/);
  assert.match(map, /walking-map-leaflet/);
  assert.match(map, /discover-map-tool-stack absolute top-2 right-2 z-30/);
});

test("Discover map stays mounted while reports refresh in the background", () => {
  assert.match(map, /reportsLoading && reports\.length === 0/);
  assert.doesNotMatch(map, /if \(loading\) return/);
  assert.doesNotMatch(reports, /setLoading\(true\)/);
});

test("Android Discover does not pull-to-refresh or apply leftover auth returns on /", () => {
  assert.match(css, /overscroll-behavior:\s*none/);
  assert.match(css, /html:has\(body\.discover-fullbleed\)/);
  assert.match(css, /\.walking-map-leaflet \{[\s\S]*isolation:\s*isolate/);
  assert.match(home, /overscroll-none/);
  assert.match(cleanup, /tab === "report" \|\| tab === "help"/);
  assert.doesNotMatch(cleanup, /tab == null/);
});

test("Android PWA icons are cache-busted PNGs, not the old SVG paw", () => {
  assert.match(manifest, /icon-192\.png/);
  assert.match(manifest, /icon-512\.png/);
  assert.match(manifest, /icon-maskable-512\.png/);
  assert.doesNotMatch(manifest, /icon\.svg/);
  assert.match(sw, /lost-pets-shell-v3/);
  assert.doesNotMatch(sw, /pathname\.startsWith\("\/icons\/"\)/);
});

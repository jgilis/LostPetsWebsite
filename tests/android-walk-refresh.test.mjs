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
const startWalkingMode = walking.slice(
  walking.indexOf("const startWalkingMode"),
  walking.indexOf("const hasActiveUserLocation"),
);

test("Walk starts watchPosition from the tap and does not abort on GPS timeout", () => {
  assert.match(startWalkingMode, /startWatch\(session\)/);
  assert.doesNotMatch(startWalkingMode, /recoveryInFlightRef\.current\) return/);
  assert.doesNotMatch(startWalkingMode, /stopWalkingMode/);
  assert.doesNotMatch(startWalkingMode, /browserGetCurrentPosition/);
  assert.match(geo, /isGeolocationPermissionDenied/);
  assert.match(walking, /isGeolocationPermissionDenied\(error\)/);
});

test("Discover map stays mounted while reports refresh in the background", () => {
  assert.match(map, /reportsLoading && reports\.length === 0/);
  assert.doesNotMatch(map, /if \(loading\) return/);
  assert.doesNotMatch(reports, /setLoading\(true\)/);
});

test("Android Discover does not pull-to-refresh or apply leftover auth returns on /", () => {
  assert.match(css, /overscroll-behavior:\s*none/);
  assert.match(css, /html:has\(body\.discover-fullbleed\)/);
  assert.match(css, /\.walking-map-host \{[\s\S]*isolation:\s*isolate/);
  assert.match(home, /overscroll-none/);
  assert.match(cleanup, /tab === "report" \|\| tab === "help"/);
  assert.doesNotMatch(cleanup, /tab == null/);
});

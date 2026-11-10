import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const activityEvents = readFileSync(
  "src/components/feed/activityEvents.ts",
  "utf8",
);
const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const filters = readFileSync("src/components/map/filters.ts", "utf8");

test("area Activity includes 14-day reunions; Mine keeps the owner's resolved reports", () => {
  assert.match(activityEvents, /ACTIVITY_REUNION_VISIBLE_MS = 14 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(activityEvents, /isRecentActivityReunion/);
  assert.match(
    activityEvents,
    /report\.status !== "resolved" \|\| isRecentActivityReunion\(report\)/,
  );
  const mineBlock = activityEvents.slice(
    activityEvents.indexOf('if (ownershipFilter === "mine")'),
    activityEvents.indexOf("filterReportsInBounds(visibleReports, bounds)"),
  );
  assert.doesNotMatch(mineBlock, /isRecentActivityReunion/);
  assert.doesNotMatch(feed, /from\("activity"\)/);
});

test("Discover map and list stay reports-only and do not show reunions", () => {
  assert.match(filters, /if \(r\.status !== "active"\) return false/);
  assert.match(map, /filterReports\(/);
  assert.doesNotMatch(map, /isRecentActivityReunion/);
});

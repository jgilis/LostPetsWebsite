import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const sheet = readFileSync(
  "src/components/discover/DiscoverDetailSheet.tsx",
  "utf8",
);
const navigation = readFileSync("src/lib/reportNavigation.ts", "utf8");
const destination = readFileSync("src/lib/homeDestination.ts", "utf8");
const home = readFileSync("app/page.tsx", "utf8");
const workspace = readFileSync(
  "src/components/discover/DiscoverWorkspace.tsx",
  "utf8",
);
const detail = readFileSync(
  "app/report/[id]/ReportDetailClient.tsx",
  "utf8",
);

test("Activity opens the report in Activity; View on Discover uses ?focus=", () => {
  assert.match(
    navigation,
    /\/\?tab=discover&focus=\$\{encodeURIComponent\(id\)\}/,
  );
  assert.match(feed, /setOpenReportId\(event\.report\.id\)/);
  assert.match(
    feed,
    /discoverHref=\{activityEventFocusHref\(openReport\.id\)\}/,
  );
  assert.doesNotMatch(feed, /reportDetailHref/);
  assert.match(sheet, /activityViewOnDiscover/);
  assert.match(destination, /if \(focus\) return "discover"/);
  assert.match(home, /detailsEnabled=\{showDiscover\}/);
  assert.match(workspace, /searchParams.get\("focus"\)/);
});

test("Discover sheet follows the focused report instead of a stale open report", () => {
  assert.match(workspace, /detailId = focusId/);
  assert.match(workspace, /key=\{detailReport\.id\}/);
  assert.match(detail, /setReport\(initialReport\)/);
  assert.match(detail, /\[initialReport\.id\]/);
});

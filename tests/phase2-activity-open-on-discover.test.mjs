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
const pane = readFileSync(
  "src/components/discover/DiscoverReportsPane.tsx",
  "utf8",
);
const detail = readFileSync(
  "app/report/[id]/ReportDetailClient.tsx",
  "utf8",
);
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

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
  assert.doesNotMatch(feed, /href=\{activityEventFocusHref\(report\.id\)\}/);
  assert.doesNotMatch(feed, /reportDetailHref/);
  assert.doesNotMatch(feed, /\/report\/\$\{/);
  assert.match(
    sheet,
    /flex flex-wrap gap-2 px-6 pb-6[\s\S]*activityViewOnDiscover[\s\S]*I spotted this animal[\s\S]*Report this post/,
  );
  assert.match(en, /activityViewOnDiscover: "View on Discover"/);
  assert.match(nl, /activityViewOnDiscover: "Bekijk op Ontdekken"/);
  assert.match(fr, /activityViewOnDiscover: "Voir dans Découvrir"/);
});

test("a focus query shows Discover and opens the Phase 1 detail sheet", () => {
  assert.match(destination, /if \(focus\) return "discover"/);
  assert.match(home, /searchParams.get\("focus"\)/);
  assert.match(home, /detailsEnabled=\{showDiscover\}/);
  assert.match(workspace, /searchParams.get\("focus"\)/);
  assert.match(workspace, /setDetailOpen\(true\)/);
  assert.match(workspace, /DiscoverDetailSheet/);
  assert.match(home, /inert=\{!showDiscover \? true : undefined\}/);
});

test("Discover sheet follows the focused report instead of a stale open report", () => {
  assert.match(workspace, /detailId = focusId/);
  assert.match(workspace, /key=\{detailReport\.id\}/);
  assert.match(workspace, /detailsEnabled && detailReport/);
  assert.match(detail, /setReport\(initialReport\)/);
  assert.match(detail, /\[initialReport\.id\]/);
});

test("Discover list stays reports-only and the map stays mounted", () => {
  assert.match(home, /DiscoverWorkspace/);
  assert.doesNotMatch(pane, /activityEventFocusHref/);
  assert.doesNotMatch(pane, /useApprovedSightings/);
  assert.doesNotMatch(workspace, /reportDetailHref/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workspace = readFileSync(
  "src/components/discover/DiscoverWorkspace.tsx",
  "utf8",
);
const sheet = readFileSync(
  "src/components/discover/DiscoverDetailSheet.tsx",
  "utf8",
);
const card = readFileSync(
  "src/components/discover/DiscoverReportCard.tsx",
  "utf8",
);
const detail = readFileSync(
  "app/report/[id]/ReportDetailClient.tsx",
  "utf8",
);
const marker = readFileSync("src/components/map/ReportMarker.tsx", "utf8");
const map = readFileSync("src/components/map/Map.tsx", "utf8");

test("marker, card, and URL focus open the Discover detail sheet", () => {
  assert.match(workspace, /DiscoverDetailSheet/);
  assert.match(workspace, /setDetailOpen\(true\)/);
  assert.match(workspace, /if \(!focusId\) return/);
  assert.match(sheet, /ReportDetailClient/);
  assert.match(sheet, /presentation="sheet"/);
  assert.match(card, /onSelect\(report\.id\)/);
  assert.doesNotMatch(card, /reportDetailHref/);
});

test("Discover reuses ReportDetailClient and does not route marker or card taps to /report/[id]", () => {
  assert.match(detail, /presentation = "page"/);
  assert.match(detail, /"sheet"/);
  assert.match(sheet, /role="dialog"/);
  assert.doesNotMatch(sheet, /\/report\/\$\{/);
  assert.doesNotMatch(card, /href=\{reportDetailHref/);
});

test("Leaflet popup is not the Discover reading UI", () => {
  assert.match(map, /enablePopup=\{isAdminScoped\}/);
  assert.match(marker, /enablePopup = false/);
  assert.match(workspace, /detailOpen && detailReport/);
});

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

test("marker, card, and URL focus open a sheet over Discover, not /report/[id]", () => {
  assert.match(workspace, /DiscoverDetailSheet/);
  assert.match(workspace, /setDetailOpen\(true\)/);
  assert.match(workspace, /if \(!focusId\) return/);
  assert.match(sheet, /ReportDetailClient/);
  assert.match(sheet, /presentation="sheet"/);
  assert.match(sheet, /role="dialog"/);
  assert.match(card, /onSelect\(report\.id\)/);
  assert.doesNotMatch(card, /reportDetailHref/);
  assert.doesNotMatch(sheet, /\/report\/\$\{/);
});

test("report photos enlarge with the existing popup lightbox", () => {
  const photo = readFileSync("src/components/map/PopupPhoto.tsx", "utf8");
  assert.match(detail, /PopupPhoto/);
  assert.match(detail, /layout="detail"/);
  assert.match(photo, /createPortal/);
  assert.match(photo, /stopImmediatePropagation/);
});

test("Leaflet popup is not the Discover reading UI", () => {
  assert.match(map, /enablePopup=\{isAdminScoped\}/);
  assert.match(marker, /enablePopup = false/);
  assert.match(workspace, /detailsEnabled && detailReport/);
});

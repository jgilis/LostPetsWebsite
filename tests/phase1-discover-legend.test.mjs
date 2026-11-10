import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const map = readFileSync("src/components/map/Map.tsx", "utf8");
const legend = readFileSync(
  "src/components/map/DiscoverMapLegend.tsx",
  "utf8",
);
const adminLegend = readFileSync("src/components/map/AdminMapLegend.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

test("Discover shows a compact public legend and keeps the admin legend separate", () => {
  assert.match(map, /DiscoverMapLegend/);
  assert.match(map, /AdminMapLegend/);
  assert.match(map, /discover-map-tool-stack/);
  assert.match(adminLegend, /Original report/);
  assert.match(legend, /mapLegendLabel/);
  assert.match(legend, /filterLost/);
  assert.match(legend, /filterFound/);
  assert.match(legend, /mapLegendArea/);
  assert.match(legend, /rounded-full/);
});

test("legend sits on the map without covering zoom, nearby, or the report sheet", () => {
  assert.match(legend, /discover-map-legend/);
  assert.match(map, /absolute top-2 right-2 z-\[510\]/);
  assert.match(css, /\.discover-map-legend \{\s*margin-left:\s*auto/);
  assert.match(legend, /detailsRef/);
  assert.doesNotMatch(legend, /open=\{isDesktop \? true : mobileOpen\}/);
  assert.doesNotMatch(legend, /bottom-/);
  assert.doesNotMatch(legend, /left-/);
});

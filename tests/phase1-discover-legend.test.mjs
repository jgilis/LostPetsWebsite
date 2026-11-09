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
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");
const marker = readFileSync("src/components/map/ReportMarker.tsx", "utf8");
const circles = readFileSync("src/components/map/CirclesLayer.tsx", "utf8");

test("Discover shows a compact public legend and keeps the admin legend separate", () => {
  assert.match(map, /DiscoverMapLegend/);
  assert.match(map, /AdminMapLegend/);
  assert.match(map, /discover-map-tool-stack/);
  assert.match(adminLegend, /Original report/);
  assert.match(legend, /mapLegendLabel/);
  assert.match(legend, /filterLost/);
  assert.match(legend, /filterFound/);
  assert.match(legend, /mapLegendArea/);
});

test("legend explains pin, dot, species colours, and approximate area", () => {
  assert.match(legend, /rounded-t-\[10px\]/);
  assert.match(legend, /rounded-full/);
  assert.match(legend, /mapLegendArea/);
  assert.match(legend, /#3b82f6/);
  assert.match(legend, /#f59e0b/);
  assert.match(legend, /#a855f7/);
  assert.match(legend, /#ef4444/);
  assert.match(legend, /#111827/);
  assert.match(marker, /report\.type === "found"/);
  assert.match(circles, /radius=\{100\}/);
});

test("legend sits on the map without covering zoom, nearby, or the report sheet", () => {
  assert.match(legend, /discover-map-legend/);
  assert.match(map, /absolute top-2 right-2 z-\[510\]/);
  assert.match(legend, /open=\{isDesktop \? true : mobileOpen\}/);
  assert.match(legend, /max-w-\[min\(11\.75rem,calc\(100%-3\.5rem\)\)\]/);
  assert.doesNotMatch(legend, /bottom-/);
  assert.doesNotMatch(legend, /left-/);
  assert.match(css, /\.discover-nearby-overlay \{/);
  assert.match(css, /\.walking-recenter-btn \{/);
});

test("legend copy exists in English, Dutch, and French", () => {
  assert.match(en, /mapLegendLabel: "Map legend"/);
  assert.match(en, /mapLegendArea: "Approximate area"/);
  assert.match(nl, /mapLegendLabel: "Kaartlegenda"/);
  assert.match(fr, /mapLegendLabel: "Légende"/);
});

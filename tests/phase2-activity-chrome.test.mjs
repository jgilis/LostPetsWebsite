import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const toolbar = readFileSync(
  "src/components/feed/ActivityToolbar.tsx",
  "utf8",
);
const activityEvents = readFileSync(
  "src/components/feed/activityEvents.ts",
  "utf8",
);
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

test("Activity drops the title and Discover chip rows", () => {
  assert.doesNotMatch(home, /<ReportFiltersBar/);
  assert.doesNotMatch(home, /t\("tabActivity"\)/);
  assert.doesNotMatch(feed, /feedFilterActive/);
  assert.doesNotMatch(feed, /feedFilterResolved/);
  assert.doesNotMatch(feed, /feedOwnershipAll/);
  assert.doesNotMatch(feed, /typeFilter/);
  assert.match(home, /animalFilter=\{animalFilter\}/);
});

test("Activity uses a Type menu on desktop and a Type sheet on Android", () => {
  assert.match(feed, /ActivityToolbar/);
  assert.match(toolbar, /activity-type-sheet/);
  assert.match(toolbar, /md:hidden/);
  assert.match(toolbar, /hidden shrink-0 items-center gap-2[\s\S]*md:flex/);
  assert.match(toolbar, /activityEventType/);
  assert.match(toolbar, /activityAreaScope/);
  assert.match(toolbar, /!mineOn \?/);
  assert.match(toolbar, /feedOwnershipMine/);
  assert.match(toolbar, /activityScopeAll/);
  assert.match(toolbar, /pressed \? "activityScopeAll" : "feedOwnershipMine"/);
  assert.match(toolbar, /aria-pressed=\{pressed\}/);
  assert.doesNotMatch(toolbar, /filterDog/);
  assert.doesNotMatch(toolbar, /Walking Mode/);
  assert.doesNotMatch(toolbar, /discoverWithin500m/);
});

test("Activity Type isolates Missing, Found, Sightings, and Reunited", () => {
  assert.match(activityEvents, /eventType === "sightings"/);
  assert.match(activityEvents, /eventType === "missing"/);
  assert.match(activityEvents, /eventType === "found"/);
  assert.match(activityEvents, /eventType === "reunited"\) return "resolved"/);
  assert.match(toolbar, /activityEventReunited/);
});

test("Activity Type copy exists in English, Dutch, and French", () => {
  assert.match(en, /activityEventAll: "All in this area"/);
  assert.match(en, /activityEventMissing: "Missing"/);
  assert.match(en, /activityEventSightings: "Sightings"/);
  assert.match(nl, /activityEventAll: "Alles in dit gebied"/);
  assert.match(nl, /activityEventSightings: "Waarnemingen"/);
  assert.match(fr, /activityEventAll: "Tout dans cette zone"/);
  assert.match(fr, /activityEventSightings: "Observations"/);
  assert.match(en, /activityScopeAll: "All activity"/);
  assert.match(nl, /activityScopeAll: "Alle activiteit"/);
  assert.match(fr, /activityScopeAll: "Toute l'activité"/);
  assert.match(en, /activityAreaScope: "Activity in this map area"/);
  assert.match(nl, /activityAreaScope: "Activiteit in dit kaartgebied"/);
  assert.match(fr, /activityAreaScope: "Activité dans cette zone de la carte"/);
  assert.match(
    en,
    /activityEmptyOpenDiscover: "Open Discover to zoom out"/,
  );
  assert.match(nl, /activityEmptyOpenDiscover: "Open Ontdekken om uit te zoomen"/);
  assert.match(
    fr,
    /activityEmptyOpenDiscover: "Ouvrir Découvrir pour dézoomer"/,
  );
});

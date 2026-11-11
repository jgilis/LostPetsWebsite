import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/page.tsx", "utf8");
const workspace = readFileSync(
  "src/components/report/ReportWorkspace.tsx",
  "utf8",
);
const form = readFileSync("src/components/report/ReportForm.tsx", "utf8");
const sheet = readFileSync(
  "src/components/discover/DiscoverDetailSheet.tsx",
  "utf8",
);
const modal = readFileSync(
  "src/components/sightings/SightingsModal.tsx",
  "utf8",
);
const submit = readFileSync("src/lib/submitSighting.ts", "utf8");
const camera = readFileSync("src/lib/lostReportsInCamera.ts", "utf8");

test("Report is a three-task chooser; spotted reuses the Discover sighting submit", () => {
  assert.match(home, /destination === "report"/);
  assert.match(workspace, /reportChooserLost/);
  assert.match(workspace, /reportChooserFound/);
  assert.match(workspace, /reportChooserSeen/);
  assert.match(workspace, /initialType=\{task\}/);
  assert.match(form, /initialType\?: "lost" \| "found"/);
  assert.match(workspace, /initialTask/);
  assert.match(workspace, /lostReportsInDiscoverCamera/);
  assert.match(camera, /report\.type === "lost"/);
  assert.match(workspace, /SightingModal/);
  assert.match(sheet, /SightingModal/);
  assert.doesNotMatch(sheet, /lostReportsInDiscoverCamera/);
  assert.match(modal, /submitSighting/);
  assert.match(submit, /functions\/v1\/smooth-processor/);
});

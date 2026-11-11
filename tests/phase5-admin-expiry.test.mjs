import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261111170000_phase5_moderation_expiry_cleanup.sql",
  "utf8",
);
const home = readFileSync("app/admin/page.tsx", "utf8");
const reportsPage = readFileSync("app/admin/reports/page.tsx", "utf8");
const sightingsPage = readFileSync("app/admin/sightings/page.tsx", "utf8");
const logPage = readFileSync("app/admin/log/page.tsx", "utf8");
const hint = readFileSync("src/lib/duplicateHint.ts", "utf8");
const form = readFileSync("src/components/report/ReportForm.tsx", "utf8");
const row = readFileSync("src/components/admin/AdminReportRow.tsx", "utf8");
const sightingsLib = readFileSync("src/lib/sightings.ts", "utf8");
const sightingDetail = readFileSync(
  "app/sightings/[id]/SightingClient.tsx",
  "utf8",
);

test("moderation audit is a private admin table filled by triggers", () => {
  assert.match(migration, /CREATE TABLE public\.moderation_actions/);
  assert.match(migration, /action IN \('approve', 'reject', 'hide', 'restore', 'resolve'\)/);
  assert.match(migration, /moderation_actions_select_admin/);
  assert.match(migration, /is_current_user_admin\(\)/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.moderation_actions FROM PUBLIC, anon/);
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /AFTER UPDATE OF status ON public\.sightings/);
  assert.match(migration, /AFTER UPDATE OF status ON public\.reports/);
  assert.match(home, /admin\/log/);
  assert.match(logPage, /getModerationActions/);
});

test("sighting approve and reject stamp reviewer and stay silent to the owner", () => {
  assert.match(migration, /NEW\.reviewed_by := auth\.uid\(\)/);
  assert.match(migration, /NEW\.moderated_at := now\(\)/);
  assert.match(sightingsPage, /filter=pending|pendingOnly/);
  assert.match(sightingsPage, /AdminSightingPhoto/);
  assert.match(sightingsPage, /observed_at/);
  assert.match(sightingsLib, /moderated_at/);
  assert.doesNotMatch(sightingsLib, /sighting_rejected/);
  assert.doesNotMatch(sightingsPage, /window\.alert/);
});

test("admin home is a queue of counts, not three equal links", () => {
  assert.match(home, /adminSightingsWaiting/);
  assert.match(home, /adminFlaggedReports/);
  assert.match(home, /adminOutOfAreaReports/);
  assert.match(home, /getAdminQueueCounts/);
  assert.match(home, /adminAllReports/);
  assert.match(home, /adminAllSightings/);
  assert.match(reportsPage, /out-of-area/);
  assert.match(reportsPage, /<Suspense/);
  assert.match(sightingsPage, /<Suspense/);
});

test("expiry job and sighting photo cleanup do not use PostGIS", () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.expire_due_listings/);
  assert.match(migration, /lostpets\.expire_listings/);
  assert.match(migration, /status = 'expired'/);
  assert.match(migration, /delete_sighting_photo_objects/);
  assert.match(migration, /sighting-photos/);
  assert.match(migration, /storage\.allow_delete_query/);
  assert.doesNotMatch(migration, /CREATE EXTENSION/);
  assert.doesNotMatch(migration, /::geography/);
});

test("duplicate hint is 300 m and 48 hours and does not block submit", () => {
  assert.match(hint, /DUPLICATE_HINT_RADIUS_M = 300/);
  assert.match(hint, /DUPLICATE_HINT_WINDOW_MS = 48 \* 60 \* 60 \* 1000/);
  assert.match(form, /fetchPossibleDuplicateReports/);
  assert.match(form, /reportDuplicateHintContinue/);
  assert.match(row, /adminDuplicateHint/);
  assert.match(reportsPage, /findPossibleDuplicates/);
});

test("phase 5 does not change sighting detail exact-location visibility", () => {
  assert.doesNotMatch(migration, /SightingClient/);
  assert.match(sightingDetail, /latitude/);
});

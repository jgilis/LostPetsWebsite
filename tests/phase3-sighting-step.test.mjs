import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const modal = readFileSync(
  "src/components/sightings/SightingsModal.tsx",
  "utf8",
);
const submit = readFileSync("src/lib/submitSighting.ts", "utf8");
const processor = readFileSync(
  "supabase/functions/smooth-processor/index.ts",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20261110190000_sighting_observed_at_and_private_photos.sql",
  "utf8",
);
const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const admin = readFileSync("app/admin/sightings/page.tsx", "utf8");
const observation = readFileSync("src/lib/sightingObservation.ts", "utf8");

test("sighting success is a pending confirmation, not an alert", () => {
  assert.match(modal, /sightingPendingTitle/);
  assert.match(modal, /sightingPendingBody/);
  assert.match(modal, /setSubmitted\(true\)/);
  assert.doesNotMatch(modal, /alert\(/);
});

test("sighting submit sends observation time and optional photo after the row exists", () => {
  assert.match(modal, /datetime-local/);
  assert.match(modal, /parseObservedAt/);
  assert.match(submit, /observed_at: input.observedAt/);
  assert.match(submit, /photo_base64/);
  assert.match(processor, /observed_at: observedAt/);
  assert.match(processor, /PHOTO_BUCKET = "sighting-photos"/);
  assert.match(processor, /\.upload\(/);
  const insertIdx = processor.indexOf(".insert({");
  const uploadIdx = processor.indexOf(".upload(");
  assert.ok(insertIdx > 0 && uploadIdx > insertIdx);
  assert.doesNotMatch(processor, /photo_url: photo_url/);
  assert.doesNotMatch(processor, /getPublicUrl/);
});

test("sighting photos stay private until an admin signs a URL; Activity uses the report photo", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS observed_at timestamptz/);
  assert.match(migration, /GRANT SELECT \(observed_at\)/);
  assert.match(migration, /'sighting-photos'/);
  assert.match(migration, /false,\s*5242880/);
  assert.match(migration, /ON CONFLICT \(id\) DO UPDATE/);
  assert.match(migration, /public = false/);
  assert.match(migration, /Admins can read sighting photos/);
  assert.match(migration, /observed_at cannot be changed/);
  assert.match(migration, /observed_at cannot be in the future/);
  assert.match(migration, /BEFORE INSERT OR UPDATE ON public\.sightings/);
  assert.doesNotMatch(migration, /DO NOTHING/);
  assert.doesNotMatch(observation, /MAX_AGE/);
  assert.doesNotMatch(processor, /MAX_AGE/);
  assert.match(admin, /resolveSightingPhotoUrl/);
  assert.match(feed, /const photoUrl = report\.photo_url\?\.trim\(\) \|\| null/);
  assert.doesNotMatch(feed, /sighting\.photo_url/);
});

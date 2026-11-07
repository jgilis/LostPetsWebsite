import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261107180000_sighting_and_notification_security.sql",
  "utf8",
);
const sightings = readFileSync("src/lib/sightings.ts", "utf8");
const submitSighting = readFileSync(
  "supabase/functions/smooth-processor/index.ts",
  "utf8",
);
const config = readFileSync("supabase/config.toml", "utf8");
const modal = readFileSync("src/components/sightings/SightingsModal.tsx", "utf8");

test("migration closes client sighting inserts and direct notification inserts", () => {
  assert.match(migration, /DROP POLICY IF EXISTS "Anyone can insert sightings"/);
  assert.match(
    migration,
    /DROP POLICY IF EXISTS "allow inserts from authenticated users"/,
  );
  assert.match(
    migration,
    /REVOKE INSERT ON TABLE public\.notification_events FROM anon, authenticated/,
  );
});

test("migration forces pending sightings and checks the lost report", () => {
  assert.match(migration, /NEW\.status := 'pending'/);
  assert.match(migration, /report\.type = 'lost'/);
  assert.match(migration, /report\.status = 'active'/);
  assert.match(migration, /only an administrator can change sighting status/);
});

test("migration hides exact sighting coordinates from API roles", () => {
  assert.match(
    migration,
    /REVOKE SELECT ON TABLE public\.sightings FROM PUBLIC, anon, authenticated/,
  );
  const columnGrant = migration.slice(
    migration.indexOf("GRANT SELECT ("),
    migration.indexOf(") ON TABLE public.sightings TO anon, authenticated"),
  );
  for (const hidden of ["latitude", "longitude", "reporter_ip_hash"]) {
    assert.doesNotMatch(columnGrant, new RegExp(`(^|[\\s,])${hidden}([\\s,]|$)`), hidden);
  }
  for (const visible of [
    "id",
    "lost_report_id",
    "created_at",
    "description",
    "photo_url",
    "status",
    "moderated_at",
    "expires_at",
  ]) {
    assert.match(columnGrant, new RegExp(`(^|[\\s,])${visible}([\\s,]|$)`), visible);
  }
  assert.doesNotMatch(migration, /REVOKE SELECT ON TABLE public\.sightings FROM service_role/);
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /SET search_path = public/);
  assert.match(migration, /profile\.is_admin IS TRUE/);
  assert.match(migration, /report\.owner_user_id = auth\.uid\(\)/);
  assert.match(
    migration,
    /REVOKE ALL ON FUNCTION public\.sighting_exact_coordinates\(uuid\[\]\) FROM PUBLIC, anon/,
  );
  assert.match(
    migration,
    /GRANT EXECUTE ON FUNCTION public\.sighting_exact_coordinates\(uuid\[\]\) TO authenticated/,
  );
});

test("migration creates the approval notification on the server", () => {
  assert.match(migration, /INSERT INTO public\.notification_events/);
  assert.match(migration, /'sighting_approved'/);
  assert.match(migration, /sightings_notify_owner_on_approval/);
  assert.match(migration, /'sighting_id'/);
  assert.match(migration, /'lost_report_id'/);
  assert.doesNotMatch(migration, /x-webhook-secret/);
  assert.doesNotMatch(migration, /BEGIN [A-Za-z0-9_-]{20,}/);
});

test("migration leaves existing approved sightings and notifications in place", () => {
  assert.doesNotMatch(
    migration,
    /\b(UPDATE|DELETE FROM|TRUNCATE)\s+public\.(sightings|notification_events)\b/i,
  );
  assert.doesNotMatch(
    migration,
    /DROP POLICY IF EXISTS "Public can view approved sightings"/,
  );
  assert.doesNotMatch(
    migration,
    /DROP POLICY IF EXISTS "public can view approved sightings"/,
  );
  assert.doesNotMatch(
    migration,
    /DROP POLICY IF EXISTS "Admins can manage sightings/,
  );
});

test("public sighting queries do not request exact coordinates or the IP hash", () => {
  const columns = sightings.slice(
    sightings.indexOf("export const PUBLIC_SIGHTING_COLUMNS"),
    sightings.indexOf("export interface Sighting"),
  );
  assert.doesNotMatch(columns, /latitude/);
  assert.doesNotMatch(columns, /longitude/);
  assert.doesNotMatch(columns, /reporter_ip_hash/);
  assert.match(sightings, /\.eq\("status", "approved"\)/);
  assert.match(sightings, /isCoordinatesRpcMissing/);
  assert.match(sightings, /isPrivilegeDenied/);
});

test("sighting submission validates an active lost report and stores pending", () => {
  assert.match(submitSighting, /report\.type !== "lost"/);
  assert.match(submitSighting, /report\.status !== "active"/);
  assert.match(submitSighting, /status: "pending"/);
  assert.match(
    submitSighting,
    /\.select\("id, lost_report_id, status, created_at"\)/,
  );
  assert.match(submitSighting, /error: \{ message: "Too many sightings\. Slow down\." \}/);
});

test("sighting submission deploys over the existing smooth-processor endpoint", () => {
  assert.match(modal, /functions\/v1\/smooth-processor/);
  assert.match(config, /\[functions\.smooth-processor\]/);
  const section = config.slice(config.indexOf("[functions.smooth-processor]"));
  assert.match(section, /verify_jwt = false/);
  assert.match(section, /functions\/smooth-processor\/index\.ts/);
});

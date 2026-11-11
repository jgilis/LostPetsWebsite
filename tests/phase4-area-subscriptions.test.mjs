import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261111160000_area_subscriptions_and_lost_in_area_notify.sql",
  "utf8",
);
const notifications = readFileSync("src/lib/notifications.ts", "utf8");
const zones = readFileSync("src/lib/areaSubscriptions.ts", "utf8");
const sheet = readFileSync(
  "src/components/account/AreaZonesSheet.tsx",
  "utf8",
);
const session = readFileSync(
  "src/components/auth/SessionControls.tsx",
  "utf8",
);
const list = readFileSync("app/notifications/NotificationsClient.tsx", "utf8");
const push = readFileSync(
  "supabase/functions/send-push-on-notification/index.ts",
  "utf8",
);
const captchaV2 = readFileSync(
  "supabase/functions/verify-captcha-v2/index.ts",
  "utf8",
);
const captchaLegacy = readFileSync(
  "supabase/functions/verify-captcha/index.ts",
  "utf8",
);
const ownerUpdate = readFileSync(
  "supabase/functions/owner-update-report/index.ts",
  "utf8",
);
const flagFn = readFileSync("supabase/functions/flag-report/index.ts", "utf8");
const en = readFileSync("src/i18n/en.ts", "utf8");

test("area subscriptions are owner-only, capped at five, and have no PostGIS", () => {
  assert.match(migration, /CREATE TABLE public\.area_subscriptions/);
  assert.match(migration, /user_id = auth\.uid\(\)/);
  assert.match(migration, /at most five area subscriptions/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /radius_m IN \(500, 1000, 2000\)/);
  assert.match(zones, /MAX_AREA_SUBSCRIPTIONS = 5/);
  assert.doesNotMatch(migration, /CREATE EXTENSION/);
  assert.doesNotMatch(migration, /::geography/);
  assert.match(session, /AreaZonesSheet/);
  assert.match(sheet, /getCurrentPosition/);
  assert.doesNotMatch(sheet, /watchPosition/);
  assert.match(en, /zoneAlertsHint:/);
});

test("one lost-in-area notice per person per report on first active insert", () => {
  assert.match(
    migration,
    /notification_events_one_lost_in_area_per_report/,
  );
  assert.match(migration, /payload ->> 'lost_report_id'/);
  assert.match(migration, /type = 'lost_report_in_area'/);
  assert.doesNotMatch(
    migration,
    /notification_events_one_lost_in_area_per_report[\s\S]{0,200}zone/,
  );
  assert.match(migration, /AFTER INSERT ON public\.reports/);
  assert.doesNotMatch(migration, /AFTER UPDATE ON public\.reports/);
  assert.match(migration, /NEW\.type IS DISTINCT FROM 'lost'/);
  assert.match(migration, /NEW\.status IS DISTINCT FROM 'active'/);
  assert.match(migration, /DISTINCT ON \(sub\.user_id\)/);
  assert.match(migration, /ON CONFLICT DO NOTHING/);
  assert.match(migration, /sub\.user_id IS DISTINCT FROM NEW\.owner_user_id/);
  assert.match(migration, /area_subscription_distance_meters/);
  assert.match(migration, /<= sub\.radius_m/);
  assert.match(
    migration,
    /sub\.animal_type IS NULL OR sub\.animal_type = NEW\.animal_type/,
  );
  assert.match(migration, /'lost_report_id', NEW\.id/);
  const notifyFn = migration.slice(
    migration.indexOf("notify_area_subscribers_on_lost_report"),
  );
  const payload = notifyFn.slice(
    notifyFn.indexOf("jsonb_build_object"),
    notifyFn.indexOf("FROM public.area_subscriptions"),
  );
  assert.match(payload, /round\(NEW\.latitude::numeric, 2\)/);
  assert.match(payload, /round\(NEW\.longitude::numeric, 2\)/);
  assert.doesNotMatch(payload, /NEW\.latitude[^:]/);
  assert.doesNotMatch(payload, /NEW\.longitude[^:]/);
  assert.doesNotMatch(payload, /sub\.label/);
  assert.doesNotMatch(payload, /sub\.latitude/);
  assert.doesNotMatch(payload, /sub\.longitude/);
});

test("captcha insert paths do not write notifications themselves", () => {
  assert.doesNotMatch(captchaV2, /notification_events/);
  assert.doesNotMatch(captchaLegacy, /notification_events/);
  assert.doesNotMatch(ownerUpdate, /notification_events/);
  assert.doesNotMatch(flagFn, /lost_report_in_area/);
  assert.match(captchaV2, /\.from\("reports"\)/);
  assert.match(captchaLegacy, /\.from\("reports"\)/);
});

test("in-app list is primary and reuses notification_events", () => {
  assert.match(zones, /AREA_NOTIFICATION_TYPE = "lost_report_in_area"/);
  assert.match(notifications, /AREA_NOTIFICATION_TYPE/);
  assert.match(notifications, /sighting_approved/);
  assert.match(notifications, /\.in\("type"/);
  assert.match(notifications, /id, type, payload, created_at, read_at/);
  assert.match(list, /notificationsAreaTitle/);
  assert.match(list, /activityEventFocusHref/);
  assert.match(list, /hasCoarsePlace/);
  assert.match(list, /LocationDisplay/);
  assert.match(list, /event.payload.latitude/);
  assert.doesNotMatch(list, /!isAreaAlert && event.payload.latitude/);
});

test("push reuses send-push-on-notification without a second stack", () => {
  assert.match(push, /lost_report_in_area/);
  assert.match(push, /\/\?tab=discover&focus=/);
  assert.match(push, /x-webhook-secret/);
  assert.match(push, /push_subscriptions/);
  assert.doesNotMatch(push, /from\("area_subscriptions"\)/);
  const lostCase = push.slice(push.indexOf('case "lost_report_in_area"'));
  assert.doesNotMatch(lostCase.slice(0, 400), /latitude/);
});

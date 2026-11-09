import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261109125500_report_and_flag_security.sql",
  "utf8",
);
const sightingMigration = readFileSync(
  "supabase/migrations/20261107180000_sighting_and_notification_security.sql",
  "utf8",
);
const reports = readFileSync("src/lib/reports.ts", "utf8");
const verifyCaptcha = readFileSync(
  "supabase/functions/verify-captcha/index.ts",
  "utf8",
);
const flagFunction = readFileSync(
  "supabase/functions/flag-report/index.ts",
  "utf8",
);
const flagReport = readFileSync("src/lib/flags.ts", "utf8");
const querySources = [
  "src/lib/reports.ts",
  "src/lib/sightings.ts",
  "src/components/report/useReports.ts",
  "app/admin/reports/page.tsx",
  "app/admin/flags/page.tsx",
  "app/edit/EditContent.tsx",
  "app/report/[id]/ReportDetailClient.tsx",
  "supabase/functions/verify-captcha/index.ts",
  "supabase/functions/verify-captcha-v2/index.ts",
  "supabase/functions/flag-report/index.ts",
  "supabase/functions/smooth-processor/index.ts",
].map((path) => ({ path, source: readFileSync(path, "utf8") }));

test("migration closes direct report inserts and public flag inserts", () => {
  assert.match(
    migration,
    /DROP POLICY IF EXISTS "Authenticated users can create reports"/,
  );
  assert.match(migration, /DROP POLICY IF EXISTS "allow insert flags"/);
  assert.match(
    migration,
    /REVOKE INSERT, TRUNCATE ON TABLE public\.reports FROM PUBLIC, anon, authenticated/,
  );
  assert.match(
    migration,
    /REVOKE INSERT, TRUNCATE ON TABLE public\.reports_flags FROM PUBLIC, anon, authenticated/,
  );
  assert.match(
    migration,
    /reports can only be created through the captcha function/,
  );
});

test("migration keeps captcha and flag service-role writes available", () => {
  assert.match(verifyCaptcha, /\.from\("reports"\)/);
  assert.match(verifyCaptcha, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(flagReport, /functions\/v1\/flag-report/);
  assert.doesNotMatch(migration, /REVOKE INSERT ON TABLE public\.reports FROM service_role/);
  assert.match(migration, /auth\.jwt\(\) ->> 'role', auth\.role\(\)/);
});

test("migration hides edit_token and flag IP hashes from API roles", () => {
  assert.match(
    migration,
    /REVOKE SELECT ON TABLE public\.reports FROM PUBLIC, anon, authenticated/,
  );
  const reportGrant = migration.slice(
    migration.indexOf("GRANT SELECT ("),
    migration.indexOf(") ON TABLE public.reports TO anon, authenticated"),
  );
  assert.doesNotMatch(reportGrant, /(^|[\s,])edit_token([\s,]|$)/);
  assert.match(reportGrant, /(^|[\s,])id([\s,]|$)/);
  assert.match(reportGrant, /(^|[\s,])owner_user_id([\s,]|$)/);
  assert.match(reportGrant, /(^|[\s,])status([\s,]|$)/);

  const flagGrant = migration.slice(
    migration.lastIndexOf("GRANT SELECT ("),
    migration.indexOf(") ON TABLE public.reports_flags TO authenticated"),
  );
  assert.doesNotMatch(flagGrant, /(^|[\s,])ip_hash([\s,]|$)/);
  assert.match(flagGrant, /(^|[\s,])reason([\s,]|$)/);
  assert.match(flagGrant, /(^|[\s,])report_id([\s,]|$)/);
});

test("migration limits owner updates and allows admin report access", () => {
  assert.match(
    migration,
    /GRANT UPDATE \(\s*description,\s*photo_url,\s*animal_name,\s*latitude,\s*longitude,\s*status\s*\)/s,
  );
  assert.doesNotMatch(
    migration,
    /GRANT UPDATE \([^)]*owner_user_id/,
  );
  assert.match(migration, /owners can only mark an active report as resolved/);
  assert.match(migration, /Admins can read all reports/);
  assert.match(migration, /Admins can update reports/);
  assert.match(migration, /Admins can read report flags/);
  assert.match(migration, /is_current_user_admin\(\)/);
});

test("report and flag queries use explicit columns without secrets", () => {
  assert.match(reports, /export const REPORT_ADMIN_SELECT/);
  assert.match(reports, /export const FLAG_ADMIN_SELECT/);
  assert.match(reports, /\.select\(REPORT_ADMIN_SELECT\)/);
  assert.match(reports, /\.select\(FLAG_ADMIN_SELECT\)/);

  const adminColumns = reports.slice(
    reports.indexOf("export const REPORT_ADMIN_SELECT"),
    reports.indexOf("export const FLAG_ADMIN_SELECT"),
  );
  assert.doesNotMatch(adminColumns, /edit_token/);
  assert.doesNotMatch(reports, /FLAG_ADMIN_SELECT = "[^"]*ip_hash/);

  for (const column of [
    "id",
    "type",
    "animal_type",
    "animal_name",
    "description",
    "latitude",
    "longitude",
    "photo_url",
    "status",
    "date_reported",
  ]) {
    assert.match(adminColumns, new RegExp(`\\b${column}\\b`), column);
  }

  for (const { path, source } of querySources) {
    assert.doesNotMatch(source, /\.from\("reports"\)[\s\S]{0,200}\.select\(\)/, path);
    assert.doesNotMatch(
      source,
      /\.from\("reports"\)[\s\S]{0,200}\.select\(["'`]?\*/,
      path,
    );
    assert.doesNotMatch(
      source,
      /\.from\("reports_flags"\)[\s\S]{0,200}\.select\(\)/,
      path,
    );
    assert.doesNotMatch(
      source,
      /\.from\("reports_flags"\)[\s\S]{0,200}\.select\(["'`]?\*/,
      path,
    );
    assert.doesNotMatch(source, /select\([^)]*edit_token/, path);
  }

  assert.doesNotMatch(verifyCaptcha, /edit_link/);
  assert.doesNotMatch(flagFunction, /\.select\(["'`]?\*/);
  assert.match(flagFunction, /\.select\("id"/);
});

test("admin flags queue is driven by flag rows, not only flagged status", () => {
  const fetchFn = reports.slice(reports.indexOf("export async function getFlaggedReportsWithFlags"));
  assert.match(fetchFn, /\.from\("reports_flags"\)/);
  assert.match(fetchFn, /\.select\(FLAG_ADMIN_SELECT\)/);
  assert.doesNotMatch(fetchFn, /\.eq\("status", "flagged"\)/);
  assert.match(fetchFn, /flagsError/);
  assert.match(fetchFn, /reportsError/);
  assert.match(fetchFn, /\.in\("id", reportIds\)/);
  assert.doesNotMatch(fetchFn, /ip_hash/);
  assert.doesNotMatch(fetchFn, /\.select\("\*"\)/);
});

test("package A does not weaken sighting security", () => {
  assert.doesNotMatch(migration, /DROP POLICY IF EXISTS "Public can view approved sightings"/);
  assert.doesNotMatch(migration, /DROP FUNCTION.*sighting_exact_coordinates/);
  assert.doesNotMatch(migration, /GRANT INSERT ON TABLE public\.sightings/);
  assert.match(sightingMigration, /REVOKE SELECT ON TABLE public\.sightings FROM PUBLIC, anon, authenticated/);
});

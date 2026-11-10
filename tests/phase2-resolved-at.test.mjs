import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261110120000_reports_resolved_at.sql",
  "utf8",
);
const previousWrite = readFileSync(
  "supabase/migrations/20261109151000_drop_reports_edit_token.sql",
  "utf8",
);
const reports = readFileSync("src/lib/reports.ts", "utf8");
const activityEvents = readFileSync(
  "src/components/feed/activityEvents.ts",
  "utf8",
);
const detail = readFileSync("app/report/[id]/ReportDetailClient.tsx", "utf8");
const edit = readFileSync("app/edit/EditContent.tsx", "utf8");

const publicSelect = reports.slice(
  reports.indexOf("export const REPORT_PUBLIC_SELECT"),
  reports.indexOf("export const REPORT_ADMIN_SELECT"),
);
const adminSelect = reports.slice(
  reports.indexOf("export const REPORT_ADMIN_SELECT"),
  reports.indexOf("export const FLAG_ADMIN_SELECT"),
);
const recentFn = activityEvents.slice(
  activityEvents.indexOf("export function isRecentActivityReunion"),
  activityEvents.indexOf("function reportIsPublicActivityParent"),
);
const mineBlock = activityEvents.slice(
  activityEvents.indexOf('if (ownershipFilter === "mine")'),
  activityEvents.indexOf("filterReportsInBounds(visibleReports, bounds)"),
);

const REUNION_VISIBLE_MS = 14 * 24 * 60 * 60 * 1000;

function isRecentActivityReunion(report, now) {
  if (report.status !== "resolved") return false;
  if (!report.resolved_at) return false;
  const at = new Date(report.resolved_at).getTime();
  if (Number.isNaN(at)) return false;
  const age = now - at;
  return age >= 0 && age <= REUNION_VISIBLE_MS;
}

test("migration adds nullable resolved_at and grants SELECT only", () => {
  assert.match(
    migration,
    /ADD COLUMN IF NOT EXISTS resolved_at timestamptz/,
  );
  assert.match(
    migration,
    /GRANT SELECT \(resolved_at\) ON TABLE public\.reports TO anon, authenticated/,
  );
  assert.doesNotMatch(migration, /GRANT UPDATE \([^)]*resolved_at/s);
  assert.doesNotMatch(migration, /GRANT UPDATE \(resolved_at\)/);
  assert.doesNotMatch(migration, /DROP POLICY/);
  assert.doesNotMatch(migration, /CREATE POLICY/);
  assert.doesNotMatch(migration, /FORCE ROW LEVEL SECURITY/);
});

test("trigger stamps resolved_at on active to resolved and rejects other writes to it", () => {
  assert.match(
    migration,
    /OLD\.status = 'active' AND NEW\.status = 'resolved'/,
  );
  assert.match(migration, /NEW\.resolved_at := now\(\)/);
  assert.match(migration, /resolved_at cannot be changed/);
  assert.match(migration, /NEW\.resolved_at := NULL/);
  assert.match(migration, /\$enforce_report_write\$ LANGUAGE plpgsql/);
  assert.match(
    previousWrite,
    /owners can only mark an active report as resolved/,
  );
  assert.match(
    migration,
    /owners can only mark an active report as resolved/,
  );
});

test("owner resolve and edit paths do not write resolved_at from the client", () => {
  assert.match(detail, /status: "resolved"/);
  assert.match(detail, /\.eq\("status", "active"\)/);
  assert.doesNotMatch(detail, /resolved_at/);
  assert.match(reports, /\.update\(\{ status \}\)/);
  assert.match(reports, /\.update\(\{ description, animal_name \}\)/);
  assert.doesNotMatch(reports, /\.update\(\{[^}]*resolved_at/);
  assert.doesNotMatch(edit, /resolved_at/);
  assert.doesNotMatch(detail, /status:\s*"active"/);
  assert.doesNotMatch(edit, /status:\s*"active"/);
});

test("Activity 14-day window uses resolved_at and treats NULL as not in the area feed", () => {
  assert.match(publicSelect, /resolved_at/);
  assert.match(adminSelect, /resolved_at/);
  assert.match(recentFn, /eventTime\(report\.resolved_at\)/);
  assert.match(recentFn, /if \(!at\) return false/);
  assert.doesNotMatch(recentFn, /date_reported/);
  assert.doesNotMatch(mineBlock, /isRecentActivityReunion/);

  const now = Date.parse("2026-11-10T10:00:00.000Z");
  const recent = {
    status: "resolved",
    resolved_at: "2026-11-09T10:00:00.000Z",
  };
  const old = {
    status: "resolved",
    resolved_at: "2026-10-01T10:00:00.000Z",
  };
  const missing = {
    status: "resolved",
    resolved_at: null,
    date_reported: "2026-11-09T10:00:00.000Z",
  };
  const stillActive = {
    status: "active",
    resolved_at: "2026-11-09T10:00:00.000Z",
  };

  assert.equal(isRecentActivityReunion(recent, now), true);
  assert.equal(isRecentActivityReunion(old, now), false);
  assert.equal(isRecentActivityReunion(missing, now), false);
  assert.equal(isRecentActivityReunion(stillActive, now), false);
  assert.equal(
    isRecentActivityReunion(
      { status: "resolved", resolved_at: "2026-10-27T10:00:00.000Z" },
      now,
    ),
    true,
  );
  assert.equal(
    isRecentActivityReunion(
      { status: "resolved", resolved_at: "2026-10-27T09:59:59.000Z" },
      now,
    ),
    false,
  );
});

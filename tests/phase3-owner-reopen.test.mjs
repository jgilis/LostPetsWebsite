import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const edit = readFileSync("app/edit/EditContent.tsx", "utf8");
const detail = readFileSync("app/report/[id]/ReportDetailClient.tsx", "utf8");
const reports = readFileSync("src/lib/reports.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20261111140000_owner_seven_day_reopen.sql",
  "utf8",
);
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

test("owner reopen is a 7-day resolved→active write gated in SQL", () => {
  assert.match(migration, /interval '7 days'/);
  assert.match(migration, /OLD\.status = 'resolved'/);
  assert.match(migration, /NEW\.status = 'active'/);
  assert.match(migration, /OLD\.resolved_at IS NOT NULL/);
  assert.match(migration, /OLD\.resolved_at <= now\(\)/);
  assert.match(reports, /resolvedMs <= nowMs/);
  assert.match(migration, /NEW\.resolved_at := NULL/);
  assert.match(migration, /owners cannot change photo or location directly/);
  assert.match(migration, /owners can only mark an active report as resolved or reopen within 7 days/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.enforce_report_write/);
  assert.doesNotMatch(migration, /DROP TRIGGER/);

  assert.match(reports, /OWNER_REOPEN_WINDOW_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(reports, /canOwnerReopenReport/);
  assert.match(reports, /reopenOwnerReport/);
  assert.match(reports, /\.update\(\{ status: "active" \}\)/);
  assert.match(reports, /\.eq\("owner_user_id", ownerUserId\)/);
  assert.match(reports, /\.eq\("status", "resolved"\)/);
  const reopenFn = reports.slice(
    reports.indexOf("export async function reopenOwnerReport"),
    reports.indexOf("export async function updateReportStatus"),
  );
  assert.doesNotMatch(reopenFn, /resolved_at/);

  assert.match(edit, /canOwnerReopenReport/);
  assert.match(edit, /reopenOwnerReport/);
  assert.match(detail, /canOwnerReopenReport/);
  assert.match(detail, /reopenOwnerReport/);

  for (const locale of [en, nl, fr]) {
    assert.match(locale, /reportReopen:/);
    assert.match(locale, /reportReopenConfirm:/);
    assert.match(locale, /reportReopenFailed:/);
  }
});

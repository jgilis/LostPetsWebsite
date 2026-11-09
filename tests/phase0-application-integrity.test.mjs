import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reportForm = readFileSync("src/components/report/ReportForm.tsx", "utf8");
const homePage = readFileSync("app/page.tsx", "utf8");
const useReports = readFileSync("src/components/report/useReports.ts", "utf8");
const map = readFileSync("src/components/map/Map.tsx", "utf8");
const feed = readFileSync("src/components/feed/ReportsFeed.tsx", "utf8");
const edit = readFileSync("app/edit/EditContent.tsx", "utf8");
const detail = readFileSync("app/report/[id]/ReportDetailClient.tsx", "utf8");
const reports = readFileSync("src/lib/reports.ts", "utf8");
const privacy = readFileSync("app/privacy/page.tsx", "utf8");
const terms = readFileSync("app/terms/page.tsx", "utf8");
const verifyCaptcha = readFileSync(
  "supabase/functions/verify-captcha/index.ts",
  "utf8",
);
const verifyCaptchaV2 = readFileSync(
  "supabase/functions/verify-captcha-v2/index.ts",
  "utf8",
);
const ownerSelect = readFileSync(
  "supabase/migrations/20261109150000_owners_can_read_own_reports.sql",
  "utf8",
);
const dropToken = readFileSync(
  "supabase/migrations/20261109151000_drop_reports_edit_token.sql",
  "utf8",
);

test("edit_token is not written or returned by captcha functions", () => {
  assert.doesNotMatch(verifyCaptcha, /edit_token/);
  assert.doesNotMatch(verifyCaptchaV2, /edit_token/);
  assert.doesNotMatch(verifyCaptcha, /edit_link/);
  assert.doesNotMatch(verifyCaptchaV2, /edit_link/);
  assert.doesNotMatch(reportForm, /edit_token/);
  assert.doesNotMatch(edit, /edit_token|\?token=/);
  assert.doesNotMatch(reports, /select\([^)]*edit_token/);
});

test("successful submit refreshes map and feed without treating errors as success", () => {
  assert.match(reportForm, /onReportCreated\?\.\(\)/);
  assert.match(reportForm, /setSubmittedReportId\(null\)/);
  assert.match(reportForm, /setMessage\(null\)/);
  assert.match(reportForm, /setMessageType\("success"\)/);
  assert.match(homePage, /onReportCreated=\{handleReportCreated\}/);
  assert.match(homePage, /refreshKey=\{refreshKey\}/);
  assert.match(homePage, /reports=\{discoverView.reports\}/);
  assert.doesNotMatch(feed, /useReports\(/);
  assert.match(useReports, /refreshKey/);
  assert.match(map, /refreshKey/);
  assert.match(reportForm, /setMessageType\("error"\)/);
  const successIdx = reportForm.indexOf("onReportCreated?.()");
  const failIdx = reportForm.indexOf('setMessageType("error")');
  assert.ok(failIdx > 0 && successIdx > failIdx);
});

test("owners can edit allowed fields and permanently delete; they cannot reopen", () => {
  assert.match(edit, /updateOwnerReportDetails/);
  assert.match(edit, /animal_name/);
  assert.match(edit, /description/);
  assert.match(edit, /canOwnerEditReportDetails/);
  assert.match(edit, /reportEditUnavailable/);
  assert.match(reports, /updateOwnerReportDetails/);
  assert.match(reports, /canOwnerEditReportDetails/);
  assert.match(reports, /\.update\(\{ description, animal_name \}\)/);
  assert.match(reports, /\.in\("status", \["active", "resolved"\]\)/);
  assert.match(reports, /\.select\("id"\)/);
  assert.match(reports, /!data\?\.length/);
  assert.match(detail, /status: "resolved"/);
  assert.match(detail, /\.eq\("status", "active"\)/);
  assert.doesNotMatch(edit, /status:\s*"active"/);
  assert.doesNotMatch(detail, /status:\s*"active"/);
  assert.match(edit, /reportDeletePermanentHint/);
  assert.match(detail, /\.delete\(\)/);
  assert.match(edit, /\.delete\(\)/);
});

test("public report fetch hides non-public statuses; owner fetch is ownership-scoped", () => {
  const publicFetch = reports.slice(reports.indexOf("export async function getReportById"));
  const ownerFetch = reports.slice(reports.indexOf("export async function getOwnerReportById"));
  assert.match(publicFetch, /isPublicFeedReport/);
  assert.doesNotMatch(
    ownerFetch.slice(0, ownerFetch.indexOf("export async function updateOwnerReportDetails")),
    /isPublicFeedReport/,
  );
  assert.match(ownerFetch, /owner_user_id/);
});

test("owner select policy does not restore public access to hidden reports", () => {
  assert.match(ownerSelect, /Owners can read their reports/);
  assert.match(ownerSelect, /owner_user_id = auth\.uid\(\)/);
  assert.doesNotMatch(ownerSelect, /GRANT INSERT ON TABLE public\.reports/);
  assert.match(reports, /isPublicFeedReport/);
  assert.match(reports, /getReportById/);
  assert.match(dropToken, /DROP COLUMN IF EXISTS edit_token/);
  assert.doesNotMatch(dropToken, /NEW\.edit_token/);
});

test("privacy copy matches implemented storage behavior", () => {
  assert.match(privacy, /small random offset/);
  assert.match(privacy, /EXIF/);
  assert.match(privacy, /public image bucket/);
  assert.match(privacy, /sightings<\/em> and/);
  assert.match(privacy, /Report submit does/);
  assert.doesNotMatch(
    privacy,
    /hashed[\s\S]{0,80}when you submit reports, sightings, or flags/i,
  );
  assert.match(privacy, /moderator hides a report/);
  assert.match(privacy, /stored photo file is deleted/);
  assert.match(terms, /public URLs/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const verifyCaptcha = readFileSync(
  "supabase/functions/verify-captcha/index.ts",
  "utf8",
);
const verifyCaptchaV2 = readFileSync(
  "supabase/functions/verify-captcha-v2/index.ts",
  "utf8",
);
const reportForm = readFileSync(
  "src/components/report/ReportForm.tsx",
  "utf8",
);
const preparePhoto = readFileSync("src/lib/prepareReportPhoto.ts", "utf8");
const reportValidation = readFileSync("src/lib/reportValidation.ts", "utf8");
const location = readFileSync("src/lib/location.ts", "utf8");
const config = readFileSync("supabase/config.toml", "utf8");
const photoMigration = readFileSync(
  "supabase/migrations/20261109140000_report_photo_cleanup_and_storage.sql",
  "utf8",
);
const packageA = readFileSync(
  "supabase/migrations/20261109125500_report_and_flag_security.sql",
  "utf8",
);
const sightingClient = readFileSync("src/lib/sightings.ts", "utf8");
const smoothProcessor = readFileSync(
  "supabase/functions/smooth-processor/index.ts",
  "utf8",
);

test("legacy verify-captcha keeps the current frontend contract", () => {
  assert.match(verifyCaptcha, /photo_url: report\.photo_url/);
  assert.match(verifyCaptcha, /latitude: report\.latitude/);
  assert.match(verifyCaptcha, /longitude: report\.longitude/);
  assert.doesNotMatch(verifyCaptcha, /edit_token/);
  assert.doesNotMatch(verifyCaptcha, /applyLocationOffset/);
  assert.doesNotMatch(verifyCaptcha, /LOCATION_OFFSET_SPAN/);
  assert.doesNotMatch(verifyCaptcha, /photo_base64/);
  assert.doesNotMatch(verifyCaptcha, /Image\.decode/);
  assert.doesNotMatch(verifyCaptcha, /contract/);
  assert.doesNotMatch(verifyCaptcha, /edit_link/);
  assert.match(config, /\[functions\.verify-captcha\]/);
  assert.match(
    config.slice(config.indexOf("[functions.verify-captcha]")),
    /verify_jwt = true/,
  );
});

test("new frontend only calls verify-captcha-v2 with the v2 contract", () => {
  assert.match(
    reportForm,
    /functions\/v1\/verify-captcha-v2/,
  );
  assert.doesNotMatch(reportForm, /functions\/v1\/verify-captcha"/);
  assert.match(reportForm, /contract: "v2"/);
  assert.doesNotMatch(reportForm, /applyLocationOffset/);
  assert.doesNotMatch(reportForm, /from ["'].*location["']/);
  assert.doesNotMatch(reportForm, /photo_url/);
  assert.doesNotMatch(reportForm, /\.from\(["']report-photos["']\)/);
  assert.doesNotMatch(reportForm, /\.upload\(/);
});

test("verify-captcha-v2 validates report fields before insert", () => {
  assert.match(verifyCaptchaV2, /SUBMISSION_CONTRACT = "v2"/);
  assert.match(verifyCaptchaV2, /body\.contract !== SUBMISSION_CONTRACT/);
  assert.match(verifyCaptchaV2, /REPORT_TYPES = \["lost", "found"\]/);
  assert.match(
    verifyCaptchaV2,
    /ANIMAL_TYPES = \["dog", "cat", "bird", "rodent", "other"\]/,
  );
  assert.match(verifyCaptchaV2, /MIN_DESCRIPTION_LENGTH = 5/);
  assert.match(verifyCaptchaV2, /MAX_DESCRIPTION_LENGTH = 4000/);
  assert.match(verifyCaptchaV2, /function validateReport/);
  assert.match(verifyCaptchaV2, /latitude < -90/);
  assert.match(verifyCaptchaV2, /longitude > 180/);
  assert.match(verifyCaptchaV2, /validateReport\(report\)/);
  assert.doesNotMatch(verifyCaptchaV2, /edit_token/);
  assert.doesNotMatch(verifyCaptchaV2, /edit_link/);
  assert.doesNotMatch(verifyCaptchaV2, /report\.photo_url/);
  assert.match(verifyCaptchaV2, /contact_info: ""/);
  assert.match(verifyCaptchaV2, /status: "active"/);
  assert.match(verifyCaptchaV2, /owner_user_id: user\.id/);
});

test("location offset is applied once on verify-captcha-v2 only", () => {
  assert.match(reportValidation, /LOCATION_OFFSET_SPAN = 0\.0005/);
  assert.match(verifyCaptchaV2, /LOCATION_OFFSET_SPAN = 0\.0005/);
  assert.match(verifyCaptchaV2, /function applyLocationOffset/);
  assert.match(
    verifyCaptchaV2,
    /verifyData\.success[\s\S]*applyLocationOffset\(\s*report\.latitude/,
  );
  assert.doesNotMatch(verifyCaptcha, /applyLocationOffset/);
  assert.match(location, /applied by verify-captcha-v2/);
});

test("photos are re-encoded and uploaded only after CAPTCHA succeeds", () => {
  assert.match(preparePhoto, /createImageBitmap/);
  assert.match(preparePhoto, /image\/jpeg/);
  assert.match(preparePhoto, /MAX_SOURCE_PHOTO_BYTES/);
  assert.match(verifyCaptchaV2, /function sanitizeJpeg/);
  assert.match(verifyCaptchaV2, /bytes\[0\] !== 0xff/);
  assert.match(reportForm, /prepareReportPhoto/);
  assert.match(reportForm, /photo_base64/);

  const captchaIdx = verifyCaptchaV2.indexOf("hcaptcha.com/siteverify");
  const sanitizeIdx = verifyCaptchaV2.indexOf("sanitizeJpeg(photoBytes)");
  const uploadIdx = verifyCaptchaV2.indexOf(".upload(");
  const insertIdx = verifyCaptchaV2.indexOf('.from("reports")');
  assert.ok(captchaIdx > 0, "captcha verify present");
  assert.ok(sanitizeIdx > captchaIdx, "sanitize after captcha");
  assert.ok(uploadIdx > sanitizeIdx, "upload after sanitize");
  assert.ok(insertIdx > uploadIdx, "report insert after photo upload");
});

test("failed photo uploads are removed when report insert fails", () => {
  assert.match(
    verifyCaptchaV2,
    /if \(error\) \{[\s\S]*\.remove\(\[photoPath\]\)[\s\S]*Database insert failed/,
  );
  assert.match(verifyCaptchaV2, /upsert: false/);
});

test("storage migration tightens writes and deletes photos of deleted reports", () => {
  assert.match(
    photoMigration,
    /DROP POLICY IF EXISTS "Allow image uploads xo88xm_0"/,
  );
  assert.match(
    photoMigration,
    /DROP POLICY IF EXISTS "Allow uploads to report-photos"/,
  );
  assert.match(photoMigration, /DELETE FROM storage\.objects/);
  assert.match(
    photoMigration,
    /AFTER DELETE OR UPDATE OF photo_url ON public\.reports/,
  );
  assert.match(photoMigration, /delete_report_photo_objects/);
  assert.doesNotMatch(photoMigration, /CREATE POLICY/);
  assert.doesNotMatch(photoMigration, /GRANT INSERT ON TABLE public\.reports/);
  assert.doesNotMatch(photoMigration, /public\s*=\s*false/);
  assert.doesNotMatch(photoMigration, /UPDATE storage\.buckets/);
  assert.doesNotMatch(photoMigration, /sightings/);
  assert.doesNotMatch(photoMigration, /reports_flags/);
});

test("package B does not weaken package A or sighting security", () => {
  assert.match(
    packageA,
    /DROP POLICY IF EXISTS "Authenticated users can create reports"/,
  );
  assert.match(packageA, /REVOKE INSERT, TRUNCATE ON TABLE public\.reports/);
  assert.doesNotMatch(reportForm, /\.from\(["']reports["']\)\s*\.insert/);
  assert.match(sightingClient, /PUBLIC_SIGHTING_COLUMNS/);
  assert.match(smoothProcessor, /status: "pending"/);
  assert.doesNotMatch(photoMigration, /GRANT INSERT ON TABLE public\.sightings/);
  assert.match(config, /\[functions\.verify-captcha-v2\]/);
  assert.match(
    config.slice(config.indexOf("[functions.verify-captcha-v2]")),
    /verify_jwt = true/,
  );
});

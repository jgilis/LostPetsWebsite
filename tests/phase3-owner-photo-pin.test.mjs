import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const edit = readFileSync("app/edit/EditContent.tsx", "utf8");
const reports = readFileSync("src/lib/reports.ts", "utf8");
const fn = readFileSync(
  "supabase/functions/owner-update-report/index.ts",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20261111100000_owner_photo_pin_via_function.sql",
  "utf8",
);
const config = readFileSync("supabase/config.toml", "utf8");

test("owner photo and pin edits go through the offsetting function, not a client write", () => {
  assert.match(edit, /LocationPicker/);
  assert.match(edit, /prepareReportPhoto/);
  assert.match(edit, /canOwnerEditPhotoAndPin/);
  assert.match(reports, /canOwnerEditPhotoAndPin/);
  assert.match(reports, /functions\/v1\/owner-update-report/);
  assert.match(reports, /\.update\(\{ description, animal_name \}\)/);
  assert.doesNotMatch(reports, /\.update\(\{[^}]*latitude/);
  assert.doesNotMatch(reports, /\.update\(\{[^}]*photo_url/);
  assert.match(fn, /LOCATION_OFFSET_SPAN = 0\.0005/);
  assert.match(fn, /applyLocationOffset/);
  assert.match(fn, /sanitizeJpeg/);
  assert.match(fn, /PHOTO_BUCKET = "report-photos"/);
  assert.match(fn, /getPublicUrl/);
  assert.match(fn, /supabaseAuth/);
  assert.match(
    fn,
    /Authorization: `Bearer \$\{serviceKey\}`/,
  );
  assert.doesNotMatch(fn, /body\.type/);
  assert.doesNotMatch(fn, /patch\.status/);
  assert.match(fn, /report.status !== "active"/);
  assert.match(config, /\[functions\.owner-update-report\]/);
  assert.match(config, /verify_jwt = true/);
  assert.match(migration, /owners cannot change photo or location directly/);
  assert.match(migration, /resolved_at cannot be changed/);
  assert.match(migration, /owners can only mark an active report as resolved/);
});

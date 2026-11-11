import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261111150000_report_photo_cleanup_allow_storage_delete.sql",
  "utf8",
);
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

test("photo cleanup may delete storage objects without blocking the report delete", () => {
  assert.match(migration, /storage\.allow_delete_query/);
  assert.match(migration, /DELETE FROM storage\.objects/);
  assert.match(migration, /EXCEPTION/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.delete_report_photo_objects/);
  assert.doesNotMatch(migration, /DROP TRIGGER/);
});

test("owner delete copy does not mention administrators", () => {
  const keySlice = (src) => {
    const start = src.indexOf("reportDeleteConfirm:");
    const end = src.indexOf("reportEditTitle:");
    return src.slice(start, end);
  };
  for (const locale of [en, nl, fr]) {
    const slice = keySlice(locale);
    assert.match(slice, /reportDeleteConfirm:/);
    assert.match(slice, /reportDeletePermanentHint:/);
    assert.doesNotMatch(slice, /administrator/i);
    assert.doesNotMatch(slice, /beheerder/i);
    assert.doesNotMatch(slice, /administrateur/i);
  }
});

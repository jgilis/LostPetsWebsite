import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sheet = readFileSync(
  "src/components/report/FlagReportSheet.tsx",
  "utf8",
);
const flags = readFileSync("src/lib/flags.ts", "utf8");
const popup = readFileSync("src/components/map/ReportPopup.tsx", "utf8");
const discover = readFileSync(
  "src/components/discover/DiscoverDetailSheet.tsx",
  "utf8",
);
const detail = readFileSync("app/report/[id]/ReportDetailClient.tsx", "utf8");
const en = readFileSync("src/i18n/en.ts", "utf8");
const nl = readFileSync("src/i18n/nl.ts", "utf8");
const fr = readFileSync("src/i18n/fr.ts", "utf8");

test("flagging uses a reason sheet and still calls flag-report", () => {
  assert.match(sheet, /FLAG_REASON_CATEGORIES/);
  assert.match(sheet, /createPortal/);
  assert.match(sheet, /disabled=\{submitting \|\| !category\}/);
  assert.match(sheet, /flagReasonSpam/);
  assert.match(sheet, /flagReasonWrongAnimal/);
  assert.match(sheet, /flagReasonUnsafe/);
  assert.match(sheet, /flagReasonOther/);
  assert.match(sheet, /flagNoteLabel/);
  assert.match(sheet, /formatFlagReason/);
  assert.match(sheet, /flagReport\(/);
  assert.doesNotMatch(sheet, /window\.prompt/);
  assert.doesNotMatch(sheet, /window\.alert/);

  assert.match(flags, /functions\/v1\/flag-report/);
  assert.match(flags, /"spam"/);
  assert.match(flags, /"wrong_animal"/);
  assert.match(flags, /"unsafe"/);
  assert.match(flags, /"other"/);
  assert.match(flags, /MAX_FLAG_NOTE_LENGTH = 400/);
  assert.match(
    flags,
    /trimmed \? `\$\{category\}: \$\{trimmed\}` : category/,
  );

  assert.match(popup, /FlagReportSheet/);
  assert.match(detail, /FlagReportButton/);
  assert.doesNotMatch(discover, /flagReport/);
  assert.match(discover, /role="dialog"\]\[aria-modal="true"\]/);
  assert.doesNotMatch(popup, /prompt\(/);
  assert.doesNotMatch(discover, /prompt\(/);
  assert.doesNotMatch(detail, /prompt\(/);
  assert.doesNotMatch(popup, /alert\(/);
  assert.doesNotMatch(discover, /alert\(/);

  assert.match(en, /flagPost: "Report this post"/);
  assert.match(en, /flagSuccess: "Thank you for reporting this post."/);
  assert.match(sheet, /submitted \? t\("flagSuccess"\) : t\("flagSheetTitle"\)/);
  assert.match(nl, /flagPost:/);
  assert.match(fr, /flagPost:/);
});

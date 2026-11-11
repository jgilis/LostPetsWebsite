import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const form = readFileSync("src/components/report/ReportForm.tsx", "utf8");
const workspace = readFileSync(
  "src/components/report/ReportWorkspace.tsx",
  "utf8",
);
const home = readFileSync("app/page.tsx", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");
const auth = readFileSync("src/lib/auth.ts", "utf8");
const redirect = readFileSync("src/lib/authRedirect.ts", "utf8");
const draft = readFileSync("src/lib/reportDraft.ts", "utf8");
const destination = readFileSync("src/lib/homeDestination.ts", "utf8");
const session = readFileSync(
  "src/components/auth/SessionControls.tsx",
  "utf8",
);
const cleanup = readFileSync(
  "src/components/auth/AuthHashCleanup.tsx",
  "utf8",
);
const i18nEn = readFileSync("src/i18n/en.ts", "utf8");

test("lost and found drafts survive magic-link login and return to Report", () => {
  assert.match(draft, /REPORT_DRAFT_STORAGE_KEY/);
  assert.match(draft, /localStorage/);
  assert.match(form, /writeReportDraft/);
  assert.match(form, /readReportDraft/);
  assert.match(form, /clearReportDraft/);
  assert.match(form, /persistDraftAndGoToLogin/);
  assert.match(form, /writeAuthReturnPath/);
  assert.match(form, /reportLoginHref/);
  assert.doesNotMatch(form, /href="\/login"/);
  assert.match(workspace, /readReportDraft/);
  assert.match(workspace, /initialTask/);
  assert.match(home, /parseReportTask/);
  assert.match(home, /initialTask=\{reportTask\}/);
  assert.match(destination, /parseReportTask/);
  assert.match(destination, /reportTaskHref/);
  assert.match(login, /signInWithEmail\(email, nextPath\)/);
  assert.match(login, /writeAuthReturnPath\(nextPath\)/);
  assert.match(auth, /safeAuthRedirectPath/);
  assert.match(auth, /writeAuthReturnPath/);
  assert.match(auth, /emailRedirectTo/);
  assert.doesNotMatch(auth, /\$\{origin\}\$\{next\}/);
  assert.match(redirect, /tab !== "report"/);
  assert.match(redirect, /startsWith\("\/\/"\)/);
  assert.match(redirect, /reportTaskHref/);
  assert.match(redirect, /AUTH_RETURN_STORAGE_KEY/);
  assert.match(redirect, /peekAuthReturnPath/);
  assert.match(redirect, /localStorage/);
  assert.match(cleanup, /peekAuthReturnPath/);
  assert.match(cleanup, /window\.location\.replace/);
  assert.match(cleanup, /readReportDraft/);
  assert.match(session, /href="\/login"/);
  assert.doesNotMatch(draft, /sessionStorage/);
  assert.doesNotMatch(redirect, /sessionStorage/);
});

test("magic-link email cap copy is 10 per hour during development", () => {
  assert.match(i18nEn, /limited to 10 magic links per hour/);
  assert.doesNotMatch(i18nEn, /limited to 2 magic links per hour/);
});

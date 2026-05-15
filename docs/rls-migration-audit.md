# RLS + Ownership Migration Audit (Phase 3.1E)

**Status:** READ-ONLY audit — no code, schema, RLS, or deployment changes were made.  
**Date:** 2026-05-15  
**Repository:** LostPetsWebsite

---

## SECTION 1 — Current Identity Architecture

The application currently operates with **two parallel identity systems** that share a single database column name (`owner_user_id` / `target_user_id`) but **do not always store the same kind of identifier**.

### System A — `owner_token` (browser identity)

| Aspect | Detail |
|--------|--------|
| **Storage** | `localStorage` key `owner_token` |
| **Generation** | `crypto.randomUUID()` on first visit (`src/lib/owner.ts`) |
| **Transport** | Sent on **every** Supabase client request as header `x-owner-token` (`src/lib/supabase.ts`) |
| **Scope** | Client-side; no server session |
| **Primary uses today** | Notification reads/writes; map “owner” UI checks; `canViewNotifications()` gate |

### System B — Supabase Auth (`auth.uid()` equivalent)

| Aspect | Detail |
|--------|--------|
| **Storage** | Supabase session (JWT) in browser |
| **Verification** | `supabase.auth.getUser()` / `getSession()` |
| **Admin** | `profiles.is_admin` keyed by `profiles.id = user.id` |
| **Scope today** | Login UI; report **creation** (single migrated write path); admin panel access |

### Column naming overlap (critical)

- **`reports.owner_user_id`** — intended as “owner identifier,” but values are **mixed by era**:
  - **Pre–3.1D:** browser `owner_token` UUID (client sent in payload; edge function did not persist it — see edge function note below)
  - **Post–3.1D:** Supabase Auth `user.id` (JWT-verified in `verify-captcha`)
- **`notification_events.target_user_id`** — populated from `reports.owner_user_id` at moderation time (`src/lib/sightings.ts`), so it inherits the same mixed semantics.

### Third path — `edit_token` (not auth-based)

- Report edit/delete uses **`edit_token`** in URL (`app/edit/EditContent.tsx`), separate from both `owner_token` and `auth.uid()`.

### RLS / policies in repository

**No RLS policy definitions exist in this repository.**  
All policy behavior must be verified in the **Supabase Dashboard** (or linked remote migrations not checked into this repo). This audit marks RLS details as **needs verification** unless observed via runtime behavior.

---

## SECTION 2 — `owner_token` Usage Map

### Core implementation

| File | Usage type | Notes |
|------|------------|-------|
| `src/lib/owner.ts` | **Definition** | `getOwnerToken()` reads/creates `localStorage.owner_token` |
| `src/lib/supabase.ts` | **Transport** | Global header `x-owner-token: getOwnerToken()` on all client Supabase requests |
| `src/lib/permissions.ts` | **UI logic** | `isOwner(ownerToken, ownerUserId)` — strict string equality; `canViewNotifications(ownerToken)` |

### Database reads (client, via anon Supabase + headers)

| File | Table | Operation | Filter / field |
|------|-------|-----------|----------------|
| `src/lib/notifications.ts` | `notification_events` | COUNT (unread) | `.eq("target_user_id", ownerToken)` |
| `src/lib/notifications.ts` | `notification_events` | SELECT (list) | `.eq("target_user_id", ownerToken)` |
| `src/lib/notifications.ts` | `notification_events` | UPDATE (mark read) | `.eq("target_user_id", ownerToken)` |
| `src/components/report/useReports.ts` | `reports` | SELECT | Reads `owner_user_id` column (no token filter; public/scoped fetch) |
| `src/lib/sightings.ts` | `reports` | SELECT (join) | Reads `owner_user_id` on related report |
| `src/lib/reports.ts` | `reports` | SELECT | Admin/utility reads; no owner_token filter |
| `app/edit/EditContent.tsx` | `reports` | SELECT / DELETE | Uses `edit_token`, not owner_token |

### Database writes (client)

| File | Table | Operation | Identity used |
|------|-------|-----------|---------------|
| `src/lib/notifications.ts` | `notification_events` | UPDATE | Scoped by `target_user_id = ownerToken` |
| `src/lib/sightings.ts` | `notification_events` | INSERT | `target_user_id: report.owner_user_id` (from report row, not browser token directly) |

### Frontend UI logic

| File | Usage type | Notes |
|------|------------|-------|
| `src/components/map/ReportMarker.tsx` | **Ownership UI** | `isOwner(getOwnerToken(), report.owner_user_id)` → controls `canSeeExactSightings` |
| `src/lib/permissions.ts` | **Authorization helper** | Owner vs admin sighting visibility rules |
| `src/components/notifications/NotificationNavLink.tsx` | **Indirect** | Uses `NotificationsProvider` → `getOwnerSightingsNotifications()` (owner_token filter) |
| `src/components/notifications/NotificationsProvider.tsx` | **Indirect** | Same notification fetch path |
| `app/privacy/page.tsx` | **Documentation** | Describes owner token to users |

### Edge functions (in repo)

| File | `owner_token` usage |
|------|---------------------|
| `supabase/functions/verify-captcha/index.ts` | **None** — uses JWT / `user.id` for `owner_user_id` on insert |

### Edge functions (referenced, not in repo)

| Function | Identity usage | Verification |
|----------|------------------|--------------|
| `smooth-processor` | Sighting creation | **needs verification** — called from `SightingsModal.tsx` without auth headers in client code |
| `flag-report` | Flag creation | **needs verification** — no identity in client payload |

### RLS policies

**needs verification** — no SQL in repo references `owner_token` or `x-owner-token`. Header may be consumed by custom RLS helpers in Supabase.

### Not found in codebase

- `submission_logs` — **no references**
- Literal string `owner_token` in SQL/RLS — **not in repo**

---

## SECTION 3 — `auth.uid()` / Supabase Auth Usage Map

> Note: `auth.uid()` does not appear literally in application source. Equivalent usage is **`user.id` from JWT** or **`supabase.auth.getUser()`**.

### Auth scaffolding (read-only / login)

| File | Usage type | Notes |
|------|------------|-------|
| `src/lib/auth.ts` | **Helpers** | `getUser()`, `signInWithEmail()` (OTP), `signOut()` |
| `app/login/page.tsx` | **UI** | Magic link login |
| `src/components/auth/AuthDebug.tsx` | **Debug** | `getSession()` + `getUser()` on `/login` |

### Database writes

| File | Table | Operation | Identity |
|------|-------|-----------|------------|
| `supabase/functions/verify-captcha/index.ts` | `reports` | INSERT | `owner_user_id: user.id` (JWT required; service role client) |

### Database reads

| File | Table | Operation | Identity |
|------|-------|-----------|------------|
| `src/hooks/useCurrentUser.ts` | `profiles` | SELECT | `.eq("id", user.id)` → `is_admin` |
| `src/hooks/useAdmin.ts` | `profiles` | SELECT | `.eq("id", userData.user.id)` → admin gate |
| `src/components/report/ReportForm.tsx` | — | Pre-submit check | `getUser()` + `getSession()`; sends `Authorization: Bearer` to edge function |
| `src/components/report/useReports.ts` | `reports` | SELECT | Reads `owner_user_id` (may contain auth UUID for new rows) |
| `src/lib/sightings.ts` | `reports` | SELECT | Reads `owner_user_id` for notification targeting |

### Frontend UI / access control

| File | Usage type | Notes |
|------|------------|-------|
| `src/hooks/useCurrentUser.ts` | **Admin flag** | Used by `ReportsLayer` for admin map behavior |
| `src/hooks/useAdmin.ts` | **Admin routes** | Redirects to `/login` if no user or not admin |
| `app/admin/*` | **Admin panel** | Gated via `useAdmin` |
| `src/components/report/ReportForm.tsx` | **Gate** | Report submit requires authenticated user |

### RLS policies

**needs verification** — expected `auth.uid()` usage in Supabase for authenticated policies; not present in repo.

### Not using auth today

| Area | Notes |
|------|-------|
| Notifications | Still keyed to `owner_token`, not `user.id` |
| Sighting submission | Edge function call without Bearer token in client |
| Edit/delete report | `edit_token` only |
| Map owner checks | `getOwnerToken()` vs `owner_user_id` |
| `profiles` | Only for `is_admin`; not used for report ownership |

---

## SECTION 4 — Conflict Analysis

### 4.1 Primary hybrid conflict — `owner_user_id` semantics

| Layer | Behavior |
|-------|----------|
| **Report create (3.1D)** | `owner_user_id` = Supabase `user.id` |
| **Map owner check** | `getOwnerToken() === report.owner_user_id` |
| **Result** | Authenticated users who created reports via 3.1D will **not** match `isOwner()` unless `owner_token` accidentally equals `user.id` (extremely unlikely) |

**Migration risk:** HIGH — map ownership UI broken for auth-created reports.

### 4.2 Notification targeting divergence

| Step | Identity |
|------|----------|
| Moderation emits event | `target_user_id = report.owner_user_id` (auth UUID for new reports) |
| User fetches notifications | `.eq("target_user_id", getOwnerToken())` (browser token) |

**Migration risk:** HIGH — report owners using auth will **not receive** in-app notifications on current code.

### 4.3 `x-owner-token` header vs JWT

Every Supabase client request sends **both** (when logged in):

- `x-owner-token` (browser UUID)
- Session JWT (default Supabase auth header)

If RLS trusts different headers for different tables, policies may be **inconsistent**. **needs verification** in Supabase.

### 4.4 Historical `owner_user_id` data

Reports created before 3.1D may have:

- `NULL` `owner_user_id` (edge function previously omitted column on insert)
- Legacy UUID in `owner_user_id` if ever set client-side

**needs verification** via database query on production data distribution.

### 4.5 `edit_token` parallel ownership

Edit/delete does not use `owner_token` or `auth.uid()`. Migrating RLS on `reports` without preserving `edit_token` policies could break edit links.

### 4.6 Admin path

Admin uses `profiles.is_admin` + auth session, not `owner_token`. Generally **orthogonal** to ownership migration, but RLS must allow admin overrides.

### 4.7 Sighting visibility

`canViewSighting()` uses `isOwner` (token-based) for non-admin users. Same conflict as map markers for auth-owned lost reports.

### 4.8 Edge functions outside repo

`smooth-processor` and `flag-report` may implement their own identity/RLS assumptions. **needs verification** before migrating sightings/flags.

---

## SECTION 5 — Migration Order Recommendation

Ranked **low → high risk** (safest first). Assumes RLS work happens in Supabase with coordinated app changes.

| Order | Target | Rationale |
|-------|--------|-----------|
| **1** | **Audit remote RLS + data** | Export policies from Supabase; count `owner_user_id` / `target_user_id` value types (NULL, token-shaped, auth-shaped). No app changes until understood. |
| **2** | **`profiles`** | Already auth-keyed; admin gate depends on it. Low coupling to `owner_token`. |
| **3** | **Auth session + client headers** | Decide single transport: JWT only vs JWT + `x-owner-token`. Document before table migrations. |
| **4** | **`reports` reads + UI** | Align `isOwner()` with `auth.uid()`; keep `edit_token` path intact. |
| **5** | **`reports` writes (complete)** | 3.1D only covers create via edge function; updates/deletes still `edit_token` / admin. |
| **6** | **`notification_events`** | Depends on stable `target_user_id` semantics; switch reads from `ownerToken` → `user.id`. |
| **7** | **`sightings` + moderation** | `updateSightingStatus` writes events using `report.owner_user_id`; edge `smooth-processor` **needs verification**. |
| **8** | **`reports_flags`** | Only referenced via `flag-report` edge function in client; **needs verification**. |
| **9** | **`submission_logs`** | No frontend usage found; **needs verification** if table exists and has RLS. |
| **10** | **Storage (`report-photos`)** | Upload in `ReportForm` uses supabase storage; policies **needs verification**. |

---

## SECTION 6 — Critical Risks

### 6.1 What will break if migrated incorrectly

| Scenario | Likely breakage |
|----------|-----------------|
| RLS on `reports` switched to `auth.uid()` only | Anonymous map reads, public report listing, or `edit_token` flows may fail |
| Notifications migrated to `auth.uid()` before reads change | Owners see zero notifications or wrong user's events |
| Map `isOwner` not updated when DB uses `user.id` | Lost-report owners lose sighting visibility on map |
| Removing `x-owner-token` before RLS updated | Silent denials on `notification_events` or custom policies |
| `target_user_id` mixed types in DB | Partial notification delivery after migration |
| Service-role edge function inserts without matching RLS | May mask issues in dev; production anon client paths still fail |

### 6.2 Hidden dependencies

1. **Global Supabase header** — `x-owner-token` affects *all* tables; RLS may implicitly depend on it (**needs verification**).
2. **Service role in `verify-captcha`** — bypasses RLS on insert; client-side reads still subject to RLS.
3. **Realtime `notification_events`** — filtered in app by `owner_token`; realtime payload does not fix ownership mismatch.
4. **`NotificationsProvider.unreadCount`** — derived from fetched events; if fetch filter wrong, badge and list both wrong together.
5. **Moderation event pipeline** — `updateSightingStatus` → `notification_events.insert` → realtime → UI; breaks if `target_user_id` ≠ consumer identity.
6. **External edge functions** — not in repo; may encode ownership or rate limits unknown to this audit.
7. **Pre-3.1D reports** — `owner_user_id` may be NULL; notification emit uses `report?.owner_user_id ?? null` → null-target events.

### 6.3 Conservative pre-migration checklist

- [ ] Export all RLS policies from Supabase (SQL dump)
- [ ] Query: `SELECT DISTINCT length(owner_user_id), count(*) FROM reports GROUP BY 1` (or similar)
- [ ] Query: `SELECT DISTINCT length(target_user_id), count(*) FROM notification_events GROUP BY 1`
- [ ] Document `smooth-processor` and `flag-report` source + identity rules
- [ ] Test matrix: logged-in vs anonymous × old report vs new report × notifications × map owner view
- [ ] Plan backfill strategy for `owner_user_id` / `target_user_id` (if any)

### 6.4 Items marked “needs verification”

| Item | Why |
|------|-----|
| All RLS policies | Not in repository |
| `x-owner-token` in RLS | Header sent client-side; policy usage unknown |
| `smooth-processor` | Sighting create path; no source in repo |
| `flag-report` | Flag create path; no source in repo |
| `submission_logs` table | Listed in scope; zero code references |
| Storage RLS for `report-photos` | Upload exists; policies not in repo |
| Historical `owner_user_id` population | Edge function previously did not set column |

---

## Appendix A — Table dependency summary

| Table | Ownership / identity field | Primary consumer in app | Current identity source |
|-------|------------------------------|-------------------------|-------------------------|
| `reports` | `owner_user_id`, `edit_token` | Map, edit, admin, create | **Mixed** (auth UUID on new create; legacy/NULL possible) |
| `notification_events` | `target_user_id` | Notifications UI, realtime | **Write:** from `reports.owner_user_id`; **Read:** `owner_token` |
| `sightings` | No direct owner column | Public/admin views | Linked via `lost_report_id` → report owner |
| `reports_flags` | **needs verification** | Admin flags page | Via edge function |
| `profiles` | `id` = `auth.users.id` | Admin detection | Auth only |
| `submission_logs` | **needs verification** | None found | — |

---

## Appendix B — File index (identity-related)

| File | `owner_token` | Auth (`user.id` / session) |
|------|:-------------:|:--------------------------:|
| `src/lib/owner.ts` | ✓ | |
| `src/lib/supabase.ts` | ✓ (header) | ✓ (session) |
| `src/lib/notifications.ts` | ✓ | |
| `src/lib/permissions.ts` | ✓ | |
| `src/lib/auth.ts` | | ✓ |
| `src/lib/sightings.ts` | indirect | reads `owner_user_id` |
| `src/lib/reports.ts` | | |
| `src/components/map/ReportMarker.tsx` | ✓ | |
| `src/components/report/ReportForm.tsx` | | ✓ |
| `src/components/report/useReports.ts` | | reads column |
| `src/hooks/useCurrentUser.ts` | | ✓ |
| `src/hooks/useAdmin.ts` | | ✓ |
| `app/edit/EditContent.tsx` | | `edit_token` only |
| `supabase/functions/verify-captcha/index.ts` | | ✓ |
| `app/login/page.tsx` | | ✓ |
| `src/components/auth/AuthDebug.tsx` | | ✓ |
| `app/privacy/page.tsx` | ✓ (docs) | |

---

*End of audit. No implementation recommendations beyond migration sequencing and risk documentation.*

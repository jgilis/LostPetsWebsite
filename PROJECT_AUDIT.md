# Lost Pets Map — implementation audit

**Date:** 7 November 2026  
**Scope:** repository inspection only. No application files were changed.  
**Method:** pages, components, client libraries, the two checked-in Edge Functions, the two checked-in SQL migrations, PWA assets, and internal docs were read. Remote Supabase (live schema, remaining RLS, storage policies, webhooks, and Edge Functions whose source is not in this repo) was **not** queried.

Status labels used below:

- **Implemented** — a wired code path exists in this repository.
- **Partial** — some of the path exists, with a clear gap or an unverified remote dependency.
- **Not found** — no implementation in this repository.
- **Needs verification** — behavior depends on Supabase state that is not in the repo.

`docs/rls-migration-audit.md` (15 May 2026) describes a removed `owner_token` / `x-owner-token` system. That system is **gone** from current source (`src/lib/permissions.ts`, `src/lib/supabase.ts`, `src/lib/notifications.ts`). Do not treat that document as the current identity model. Its warning that most RLS is not in the repo is still true.

---

## 1. Project overview

### Stack

| Layer | What is in the repo |
| --- | --- |
| App | Next.js **16.2** App Router, React **19.2**, TypeScript. `package.json`, `next.config.ts`, `app/`. |
| Styling | Tailwind CSS 4 (`tailwind.config.js`, `app/globals.css`). |
| Map | Leaflet 1.9 + react-leaflet 5. Clustering is **supercluster** (`src/components/map/useSupercluster.ts`). `react-leaflet-cluster` is a dependency and is **not imported**. |
| Data | `@supabase/supabase-js` browser client only (`src/lib/supabase.ts`). |
| Captcha | `@hcaptcha/react-hcaptcha` on the report form; verified in `supabase/functions/verify-captcha`. |
| Push | `web-push` inside `supabase/functions/send-push-on-notification`. |
| i18n | In-app dictionaries, not a library. `src/i18n/` — `en`, `nl`, `fr`. |

There are **no** Next.js route handlers (`app/api`) and **no** server actions (`"use server"`). Almost every read and write goes from the browser to Supabase. Report creation is the exception: the browser calls an Edge Function that inserts with the service role.

### Hosting and deployment

**Not defined in the repo.** There is no `vercel.json`, Dockerfile, or GitHub Actions workflow. `.vercel` is gitignored (`.gitignore`), which only shows Vercel may have been used locally. `next.config.ts` sets `allowedDevOrigins: ["127.0.0.1"]` and nothing else.

README expects `npm run dev` / `npm run build` / `npm run lint`. Production host, domain, and whether the checked-in migrations and functions are actually deployed **need verification**.

Edge Function URLs are **hardcoded** to project ref `dmubikdkyusadzqngapy`, not `NEXT_PUBLIC_SUPABASE_URL`:

- `src/components/report/ReportForm.tsx` → `verify-captcha`
- `src/components/sightings/SightingsModal.tsx` → `smooth-processor`
- `src/lib/flags.ts` → `flag-report`

### Database, auth, backend

- **Postgres + Auth + Realtime + Storage + Edge Functions** via Supabase. Client: `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` in `src/lib/supabase.ts`.
- **Auth:** email magic link only. `signInWithOtp` in `src/lib/auth.ts`, UI in `app/login/page.tsx`. No passwords, OAuth, or anonymous Supabase users.
- **Checked-in functions:** `verify-captcha` (`verify_jwt = true`), `send-push-on-notification` (`verify_jwt = false`, shared-secret header). `supabase/config.toml`.
- **Called but source not in repo:** `smooth-processor` (sighting create), `flag-report` (user flags). Their validation, status defaults, rate limits, and IP hashing **need verification**.

### PWA and mobile

**PWA is implemented. A native app is not.**

- Manifest: `public/manifest.json` (`display: standalone`, SVG icons). Linked from `app/layout.tsx` metadata, including `appleWebApp`.
- Service worker: `public/sw.js`, registered only when `NODE_ENV !== "development"` (`src/components/pwa/ServiceWorkerRegistration.tsx`).
- Install UI: `src/components/pwa/PwaInstallButton.tsx`, `src/hooks/usePwaInstall.ts`.
- No Capacitor / Android project. `docs/native-readiness-audit.md` is a browser-coupling note for a possible future native port, not an implementation.

### Directory map

```
app/                  App Router pages (home, login, report, sighting, edit, notifications, admin, legal)
src/components/       map, report, feed, sightings, admin, notifications, auth, nearby, pwa, i18n, sync
src/lib/              reports, sightings, auth, notifications, push, flags, geo, location, analytics
src/hooks/            admin, walking mode, leaflet, realtime resilience, PWA install
src/i18n/             en / nl / fr dictionaries
supabase/functions/   verify-captcha, send-push-on-notification
supabase/migrations/  two SQL files only (notifications RLS, push_subscriptions)
public/               manifest, sw.js, offline.html, icons, leaflet marker images expected at /leaflet
docs/                 older audits; proximity architecture freeze
```

---

## 2. User-facing functionality

Routes that exist:

| Path | Role | Auth |
| --- | --- | --- |
| `/` | Map, feed, and report tabs (`app/page.tsx`) | Browse open; submit requires login |
| `/login` | Magic link | Public |
| `/report/[id]` | Report detail (`app/report/[id]/page.tsx`) | Public read; owner actions if logged in |
| `/edit?id=` | Delete own report (`app/edit/EditContent.tsx`) | Login + ownership check |
| `/sightings/[id]` | Sighting detail | No login gate in the page |
| `/notifications` | In-app alerts | No redirect; empty if signed out |
| `/admin`, `/admin/reports`, `/admin/flags`, `/admin/sightings` | Moderation | Client redirect to `/login` unless `profiles.is_admin` |
| `/about`, `/privacy`, `/terms` | Static copy | Public |

Home tabs: **Map**, **Feed**, **Report**. Query `?tab=feed|report` and `?focus=<reportId>` (forces the map tab). `app/page.tsx`.

### Map and discovery — implemented

Main map: `src/components/map/Map.tsx` (client-only via `MapWrapper.tsx`).

- **Tiles:** OpenStreetMap `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. Main map has no attribution string; the location picker does.
- **Center:** Mechelen `[51.025, 4.477]`, zoom 13. `minZoom` 10, `maxZoom` 16 (18 while Walking Mode is on).
- **Viewport lock:** `maxBounds` southwest `[50.75, 4.10]` to northeast `[51.30, 4.80]`, viscosity 1. This is wider than the “usual Mechelen area” used for admin warnings (`src/lib/mechelenBounds.ts`: lat 51.0–51.1, lng 4.4–4.5).
- **Data load:** `useReports` (`src/components/report/useReports.ts`) selects **all** public-feed reports (`status` active or resolved after client normalization). There is no bounding-box or PostGIS query. Map markers then keep only `status === "active"` (`filterReports` in `src/components/map/filters.ts`).
- **Lost vs found:** lost = pin (`ReportMarker` + animal icon). Found = non-interactive colored `CircleMarker` (radius 8) plus an invisible larger hit target for the popup.
- **Colors:** dog blue, cat amber, bird purple, rodent red, other near-black (`Map.tsx`).
- **Halos:** at zoom ≥ 13.5, and not while a `?focus=` target is set, `CirclesLayer` draws a **100 m** circle per visible report. Visual only.
- **Clustering:** supercluster radius 50 px, `maxZoom` 20 (`useSupercluster.ts`). Cluster click zooms to expansion zoom. A small **display jitter** (`jitterCoords`) offsets marker geometry so stacked points separate; stored coordinates are unchanged.
- **Filters:** animal (`all | dog | cat | bird | rodent | other`) and type (`all | lost | found`). Shared by map and feed via `ReportFiltersBar` on the home page. **No text search.**
- **Popups:** `ReportPopup.tsx` — type, animal, optional name, description, photo, “view full report”. Click on empty map closes popups (`MapClickCloser`).
- **Focus:** `/?focus=<id>` opens that report’s popup (`useReportUrlFocus.ts`). Admin deep link `/?mapMode=admin-scoped&focusReport=&focusSighting=` loads one report and its sighting markers (`useReportSightings.ts`, `AdminMapLegend.tsx`).
- **Realtime:** `postgres_changes` on `public.reports` refetches the list (`useReports`). Visibility changes and channel reconnect also refetch (`VisibilitySyncProvider`, `RealtimeResyncProvider`, `useResilientRealtimeChannel`).
- **Nearby list (separate from the pin layer):** `NearbyAwareness.tsx` lists active reports within **500 m** of the map center, or of the user while Walking Mode has a fresh GPS fix. Haversine in `src/lib/geo/getNearbyReports.ts`. Labels: Very close (&lt; 75 m), New nearby, Seen. Seen-memory is **in-memory for the page session only** (`src/lib/geo/proximityMemory.ts`). Documented as frozen in `docs/proximity-architecture.md`.
- **Walking Mode:** foreground `watchPosition` (`src/hooks/useWalkingMode.ts`, `src/lib/platform/browserGeolocation.ts`). Shows the user on the map (`WalkingModeMapLayers.tsx`), follow/recenter, session time and distance. Stale after 60 s. Not background tracking. Not persisted.

**Location representation**

- Stored report coordinates are whatever `verify-captcha` inserts.
- Before submit, the form runs `applyLocationOffset` (`src/lib/location.ts`): random shift of ±0.00025° (the constant `0.0005` is the full span). Comment says “~50 m”. This runs **in the browser**, so a modified client can send exact coordinates. The Edge Function does not re-offset.
- UI labels use Nominatim reverse geocode to a coarse “Near {neighbourhood|suburb|village|town|road|park}”, falling back to “Near Mechelen” (`src/lib/location/reverseGeocode.ts`, `LocationDisplay.tsx`). Cache key is 4 decimal places (`src/lib/location/constants.ts`). Raw coordinates are not the normal public label.
- Admins see raw coordinates to 4–5 decimals (`AdminReportRow`, admin sightings page).

### Missing and found pets — partial

**Submit (implemented, with limits).** `ReportForm.tsx` → storage upload → `verify-captcha`.

Fields the form actually collects:

- type: `lost` | `found` (select; initial value is `""` and the submit handler does **not** require a choice)
- animal type: dog, cat, bird, rodent, other (same gap)
- optional animal name
- description (client requires trim length ≥ 5)
- one image (`accept="image/*"`, no size or MIME check in code)
- map point (click or drag). Default pin is Mechelen `[51.0206, 4.4756]` (`LocationPicker.tsx`, picker bounds tighter than the main map: `[50.90, 4.30]`–`[51.15, 4.65]`)
- hCaptcha
- consent checkbox

`contact_info` is always sent as `""`. There is no contact field. Privacy copy that says contact details can be added is **ahead of the UI**.

On success the Edge Function inserts `status: "active"`, `owner_user_id: user.id`, a random `edit_token`, `date_reported: now`, `expires_at: now + 120 days` (`30 * 4` days in `verify-captcha/index.ts`). Reports are **public immediately**. They are not held for approval.

**Edit:** **not implemented.** `/edit` and the detail-page “Edit” link only **delete**. The page comment says “future edit” (`app/edit/page.tsx`). Field updates (text, photo, location, type) do not exist.

**Close / mark found:** two different ideas exist.

- `type: "found"` is a report category (someone found an animal), not a lifecycle state.
- `status: "resolved"` means closed/reunited. The owner can set it from the detail page (`ReportDetailClient.handleMarkResolved`). Admins can set it from `/admin/reports`. Resolved reports leave the map and can be shown in the feed.

**Delete:** owner delete from the detail page and from `/edit`, both `.delete().eq("id").eq("owner_user_id", userId)`. Whether RLS allows that **needs verification**.

**Expiry:** the insert sets `expires_at`. `normalizeReportRow` (`src/lib/reports.ts`) locally relabels `active` → `expired` when `expires_at` is in the past. Map and feed then hide those rows. **No scheduled job** in the repo updates the database status or deletes rows. Expiry is a client-side display rule.

**Duplicates:** **not found** in application code. The privacy page claims duplicate detection. That claim is not backed by this repo.

**After submit:** success panel links to `/edit?id=<id>` and can switch to the map tab. `onReportCreated` is accepted by `ReportForm` and passed from `app/page.tsx`, but **never called**, so `refreshKey` does not bump. Map refresh depends on realtime or a later refetch.

### Sightings — partial

UI: “I spotted this animal” on a **lost** report popup, hidden when the viewer is the owner (`ReportPopup.tsx`). Modal: `SightingsModal.tsx`.

- **Linking:** yes. Body sends `lost_report_id` to `smooth-processor`.
- **Location:** “Use my location” (`navigator.geolocation.getCurrentPosition`, one shot) or “Pick on map” (`LocationPicker`). **No privacy offset** on sightings.
- **Text:** optional description. Placeholder is hardcoded English.
- **Photo:** **not in the modal.** `photo_url` exists on the `Sighting` type and is selected in queries, but the submit payload has no photo.
- **Timestamp:** not sent by the client. Any `created_at` would be a database default. **Needs verification.**
- **Accuracy:** `location_accuracy_meters` is selected by `getApprovedSightings` but **not sent** by the modal (GPS accuracy is discarded).
- **Out of area:** if the point is outside `MECHELEN_AREA_BOUNDS`, the modal shows a warning. It still submits.
- **Auth / captcha:** the fetch sends **no** `Authorization` header and **no** captcha.
- **After submit:** `alert("Sighting submitted!")` and the modal closes. No in-app list of “my sightings”. No confirmation page.

Pending vs public **needs verification** inside `smooth-processor` (not in repo). This repo’s admin UI and README assume new sightings are `pending` until approve/reject. The client never sets `status`.

`getApprovedSightings` (`src/lib/sightings.ts`) does **not** filter `.eq("status", "approved")` or check `expires_at`. It returns every sighting row for that report that RLS allows. The popup shows exact sighting places only to the report owner or an admin; everyone else sees “This animal has recently been sighted nearby.” If RLS returns non-approved rows, they would be included. **Needs verification.**

`/sightings/[id]` (`SightingClient.tsx`) renders description, status, and a map with the **exact** sighting coordinate (`SightingMap.tsx`). It does not check status before rendering. Public vs owner-only access depends on RLS. **Needs verification.**

### Feed / activity — implemented for reports only

`src/components/feed/ReportsFeed.tsx`.

- Shows report cards: photo or animal placeholder, name or species, lost/found, coarse location, timestamp, truncated description.
- Sort: `date_reported` newest first (missing dates sort last).
- Filters: same animal and lost/found filters as the map, plus lifecycle `active | resolved | all`, plus `all | mine` (mine matches `auth user id === owner_user_id`).
- Hidden statuses: `flagged`, `removed`, `expired`.
- **Does not include sightings** or other activity events.
- Scroll position is restored when returning from a report (`src/lib/reportNavigation.ts`).
- Realtime is the same `useReports` subscription as the map.

### Notifications — partial

**In-app (implemented for one event type).**

- Table `notification_events`. Reads in `src/lib/notifications.ts` filter `target_user_id = auth user id` and `type = "sighting_approved"`.
- Created only in `updateSightingStatus` when an admin (or whoever RLS allows) sets a sighting to `approved`. Payload: `sighting_id`, `lost_report_id`, latitude, longitude, status.
- UI: `/notifications` (`NotificationsClient.tsx`). Opening the page sets `read_at` on **all** unread rows for that user (`markNotificationsAsRead`), then reloads.
- Badge: `NotificationNavLink` unread count. The nav link is visible when signed out; the list is empty because there is no user id.
- Realtime: footer `RealtimeDebug` (UI hidden) subscribes to `INSERT` on `notification_events` and reloads the list (`SiteFooter.tsx`). Not filtered by user in the subscription itself; the subsequent query is.

**Browser push (implemented in code, delivery wiring needs verification).**

- Opt-in / opt-out in the footer when logged in and the browser supports Push (`PushNotificationControls.tsx`, `src/lib/pushNotifications.ts`).
- Requires `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Subscription upserted into `push_subscriptions` on `endpoint`.
- `send-push-on-notification` expects a database webhook `POST` with header `x-webhook-secret` = `PUSH_WEBHOOK_SECRET`. It sends only for `type === "sighting_approved"`. It deletes subscriptions that return HTTP 404 or 410.
- The webhook itself is **not** in the repo (comment at the top of the function only). Whether it is attached in Supabase **needs verification**.
- The function also has copy for `sighting_rejected` and `sighting_updated`, but it returns early unless the type is `sighting_approved`, and this repo never inserts those other types.

**Not found:** a preference center beyond push on/off; notifications for new reports, flags, or moderation of one’s own submission; server-side deduplication of events (no unique constraint in the checked-in SQL). Re-approving a sighting would insert another event.

---

## 3. Authentication and user accounts

**Method:** Supabase email OTP / magic link. Redirect target is `window.location.origin` (`src/lib/auth.ts`). `AuthHashCleanup.tsx` strips the auth hash after return. Login rate-limit errors from Supabase are mapped to copy that says 2 links per hour (`app/login/page.tsx`, `src/i18n/en.ts`). That limit is Supabase’s, not an app setting in this repo.

**Session:** `UserProfileProvider` listens to `onAuthStateChange`, stores the user, and loads `profiles.is_admin` (`src/lib/profileAdminCache.ts`). Admin flag is cached in memory and `sessionStorage` until sign-out. A revoked admin can look like an admin in the UI until the cache clears. Enforcement still depends on RLS.

**What requires login**

| Action | Gate in this repo |
| --- | --- |
| Browse map, feed, report detail, legal pages | No |
| Submit a report | Client checks `getUser` + session; Edge Function requires `Bearer` JWT and sets `owner_user_id` |
| Resolve or delete own report | Client `isOwner(user.id, owner_user_id)` plus `.eq("owner_user_id", user.id)` |
| Open `/edit` | Same ownership check |
| Read and mark notifications | Query filtered by `auth.uid()`; RLS migration matches that for SELECT/UPDATE |
| Enable push | Must be logged in |
| Submit a sighting | **No login in the client** |
| Flag a report | **No login in the client** |
| Admin pages | `useAdmin` redirects to `/login` if `!user \|\| !isAdmin` |

**Profile / settings:** footer account control shows the email and a log-out button (`SessionControls.tsx`). Language switcher and push toggle sit beside it. There is no profile page, no email change, no password, no “my sightings” page.

**Owned reports:** feed filter “mine”, “you reported this” on the popup and detail page, owner-only resolve/delete. Ownership is `reports.owner_user_id === auth.users.id` for reports created by the current Edge Function.

**`edit_token`:** still generated and returned as `edit_link` (`/edit?token=...`) by `verify-captcha`. The edit page reads `?id=`, not `?token=`. The token path is leftover.

**Account deletion and recovery:** **not found.** Magic link is the only recovery. No `deleteUser` call.

**Anonymous vs registered:** anyone can read the map and feed. Registered users are Supabase Auth users. There is no separate anonymous identity anymore.

---

## 4. Moderation and administration

### Who is an admin

One flag: `profiles.is_admin` (`fetchIsAdminForUser`). **No second role** (no moderator vs admin, no permissions table in this repo). Admin UI is a client redirect, not a server layout check. `app/admin/page.tsx`, `src/hooks/useAdmin.ts`.

Whether `profiles` rows are created by a trigger on signup **needs verification** (no trigger SQL in the repo). A user with no profile row is treated as not admin.

### What admins can do in the UI

`/admin` links to three tools. Copy is translated on reports and flags; the sightings page is hardcoded English.

**All reports** (`app/admin/reports/page.tsx`, `AdminReportRow.tsx`)

- Lists every report `getAllReports()` returns (not only active).
- Shows animal, type, status, truncated description, photo thumbnail, coordinates, time, id.
- Rows outside the Mechelen box are highlighted (`isReportOutOfMechelen`).
- Actions: **Resolve** (`status = resolved`), **Remove** (`status = removed`, confirm dialog; the label in the UI is “hidden” via `formatAdminReportStatus` / i18n `statusHidden`).
- Does **not** edit text, photos, or location. Does **not** hard-delete.

**Flagged queue** (`app/admin/flags/page.tsx`)

- Loads reports with `status = "flagged"` and all rows from `reports_flags`.
- Joins them in the browser on `report_id`.
- Shows flag count, up to 5 reasons, last flagged time.
- Actions: Resolve, Remove, **Restore** (`active`), **Keep flagged**.

**Sightings** (`app/admin/sightings/page.tsx`)

- Lists all sightings `getAdminSightings()` returns, newest `created_at` first.
- Shows coordinates, linked animal, distance from the report point, description, status.
- **Approve** and **Reject** call `updateSightingStatus`. Approve also inserts `notification_events`.
- Links: platform map (`mapMode=admin-scoped`) and Google Maps.
- `photo_url` is selected and **not rendered**.
- `updateSightingStatus` accepts `removed` and `pending`, but the page has **no buttons** for those.
- `reviewed_by`, `moderation_reason`, and `moderated_at` exist on the `AdminSighting` type and are **not written** by `updateSightingStatus`.

Admin report lists resubscribe to `reports` changes (`useAdminReportsSync`). The sightings page does not.

### Approval before public

- **Reports: no.** Insert status is `active`.
- **Sightings: intended, not proven from this repo.** Admin tools assume a pending queue. The insert function is not in the repo.
- **Flags:** user flag calls `flag-report`. This repo only displays flags for reports already in status `flagged`. Whether the Edge Function sets that status **needs verification**.

### User reports of content

Implemented in the popup for non-owners: `prompt("Why are you reporting this post?")` then `flagReport` (`src/lib/flags.ts`). Success and failure are `alert()`s. No photo-specific report, no category list, no auth.

### Found / resolved / removed

- Owner or admin sets `resolved`. Map hides it (`filterReports`). Feed can still show it.
- Admin “remove” sets `removed`. Map and feed hide it (`isPublicFeedReport` / `filterFeedReports`). The row remains.
- Nothing in this repo deletes storage objects when a report is removed or deleted.

### Audit log

**Not found.** No `moderation_log` (or similar) write in the client or the checked-in functions. Sighting reviewer fields are unused by current writes.

### Abuse controls that exist in this repo

- hCaptcha on **report** submit only, checked server-side in `verify-captcha`.
- Browser `localStorage` key `last_submit_time`: 30 seconds between report submits. Not enforced server-side. Cleared by the user, and not shared across devices.
- Supabase magic-link rate limit, surfaced in the login UI only.
- Mechelen-bounds **warning** for admins and for sighting submitters. Submit is not blocked.
- Description minimum length on the client only. The Edge Function does not check length, URL scheme, animal enum, or coordinate bounds.
- React text rendering avoids HTML injection for descriptions. There is no link allowlist because there is no link field.

Claimed in `app/privacy/page.tsx` and **not implemented in this repo:** hashed IP storage, duplicate detection, optional public contact details. `AdminSighting.reporter_ip_hash` is a TypeScript field and is never selected or written here. It may exist only inside `smooth-processor`. **Needs verification.**

---

## 5. Backend and database

### What is actually in git

Only two migrations:

1. `supabase/migrations/20260515120000_notification_events_auth_uid_read.sql`  
   Drops existing SELECT and UPDATE policies on `public.notification_events`, enables RLS, then:
   - `notification_events_select_own_uid` — `authenticated`, `auth.uid() = target_user_id`
   - `notification_events_update_own_uid` — same, for mark-read  
   INSERT policies are explicitly left unchanged. **Those INSERT policies are not in the repo.**

2. `supabase/migrations/20260515140000_push_subscriptions.sql`  
   Creates `public.push_subscriptions` (`id`, `user_id` → `auth.users` on delete cascade, `endpoint` unique, `p256dh`, `auth`, `created_at`), index on `user_id`, RLS so authenticated users can select/insert/update/delete only their own rows.

The base tables (`reports`, `sightings`, `reports_flags`, `profiles`, `notification_events` itself) and their foreign keys, checks, and policies are **not** in this repository. The live database is the source of truth. Everything below about those tables is inferred from queries and inserts.

### Tables the app actually uses

**`reports`** — lost/found posts.

Columns touched by code: `id`, `type`, `animal_type`, `animal_name`, `description`, `latitude`, `longitude`, `contact_info`, `photo_url`, `status` (`active | flagged | removed | resolved | expired`), `expires_at`, `owner_user_id`, `edit_token`, `created_at`, `date_reported`.

Flow: Edge Function insert (service role) → public select for map/feed/detail → owner update to `resolved` or delete → admin update of `status`.

**`sightings`** — points tied to a lost report.

Columns touched: `id`, `lost_report_id`, `latitude`, `longitude`, `location_accuracy_meters`, `description`, `photo_url`, `status` (`pending | approved | rejected | expired`, plus admin string `removed`), `created_at`, `moderated_at`, `expires_at`, and on the admin type only `reporter_ip_hash`, `moderation_reason`, `reviewed_by`.

Relationship used in queries: `sightings.lost_report_id` embedded as `reports:lost_report_id (...)`. A foreign key is likely but **not declared in repo SQL**.

Flow: `smooth-processor` insert (external) → admin approve/reject → on approve, insert `notification_events` for `reports.owner_user_id` → owner reads notification → `/sightings/[id]`.

**`reports_flags`** — columns used: `id`, `report_id`, `reason`, `created_at`. Written only by `flag-report` (external). Read by `getFlaggedReportsWithFlags`.

**`notification_events`** — columns used: `id`, `type`, `target_user_id`, `payload` (json), `created_at`, `read_at`.  
Flow: admin approval insert → realtime INSERT → owner list. Push function reads the webhook’s `record`, not the table, except to load `push_subscriptions`.

**`profiles`** — `id` (matched to the auth user id), `is_admin`. Read-only from the app.

**`push_subscriptions`** — see migration. User opt-in rows. Service role in the push function deletes stale endpoints (bypasses RLS).

**`auth.users`** — referenced by `push_subscriptions.user_id`. Report ownership stores the same uuid in `reports.owner_user_id` without a foreign key visible in repo.

**`submission_logs`:** named in the old RLS audit, **no references** in current code.

### Storage

Bucket name **`report-photos`**. Upload from `ReportForm.tsx`: random uuid filename, `cacheControl: 3600`, `upsert: true`, then `getPublicUrl`. The public URL is stored on the report.

The upload happens **before** captcha verification and **before** the insert. A failed submit can leave a public object. No size limit, no server-side content check, no deletion path. Bucket policies are **not** in the repo. **Needs verification** (public read, who can upload, allowed MIME types).

Sighting photos are not uploaded by the current modal.

### Edge Functions

| Function | In repo | Role |
| --- | --- | --- |
| `verify-captcha` | Yes | hCaptcha siteverify, JWT `getUser`, service-role insert into `reports`. CORS `*`. |
| `send-push-on-notification` | Yes | Webhook-authenticated web push for `sighting_approved`. |
| `smooth-processor` | **No** | Sighting create. |
| `flag-report` | **No** | Flag create. |

`verify-captcha` does not validate enums, length, bounds, or that `photo_url` points at the project’s bucket. It returns the inserted row (including `edit_token`) to the browser.

### Triggers, jobs, realtime, geo

- **Triggers:** none in repo.
- **Cron / pg_cron:** none in repo. Expiry is not a database job here.
- **Realtime subscriptions in the client:**
  - `reports` all events — map, feed, admin lists
  - `notification_events` INSERT — notification reload
- **PostGIS:** **not found.** Distance is haversine in the browser (`src/lib/geo/haversine.ts` and a second copy in the admin sightings page). No `rpc()` calls.

---

## 6. Security, privacy, and reliability

Implemented:

- Magic-link auth; report insert refuses missing JWT (`verify-captcha`).
- hCaptcha verified with `HCAPTCHA_SECRET_KEY` before insert.
- Report coordinates are offset in the honest client.
- Public location labels are coarsened through Nominatim when the request succeeds.
- Sighting popup hides exact sighting coordinates from people who are not the owner or an admin (`ReportMarker` `canSeeExactSightings`).
- Notification SELECT/UPDATE RLS in the checked-in migration is owner-scoped.
- Push subscriptions RLS is owner-scoped. Push webhook requires a shared secret. Expired push endpoints are removed.
- Service role keys appear only as `Deno.env` reads inside Edge Functions, not in the Next.js client.
- `.env*` is gitignored. README lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Push also needs `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL`, `PUSH_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` as function secrets (comments in the push function). No `.env.example` is in the repo even though the README tells you to copy one.

Obvious concerns (not fixed):

1. **Admin and owner writes are only hinted at in the UI.** `updateReportStatus`, owner resolve/delete, and `updateSightingStatus` (which also inserts a notification) use the anon-key client. If RLS is missing or too open, any user who can call Supabase can change rows. The policies that would prevent that are **not in this repo** except notification read/update and push subscriptions.
2. **Report insert uses the service role**, so it bypasses RLS. Safety is whatever `verify-captcha` checks. Those checks are captcha + a valid user, not content or location rules.
3. **Client-side offset and client-side rate limit** are not authoritative.
4. **Photos are public** and uploaded before the report exists. No type/size enforcement in code.
5. **Sighting and flag endpoints are unauthenticated in the client**, with no captcha. Abuse behavior of the missing functions is unknown.
6. **`/sightings/[id]` shows exact coordinates** with no owner check in the page. That undercuts the popup’s coarser sighting message if the row is publicly readable.
7. **`REPORT_PUBLIC_SELECT` includes `owner_user_id` and `contact_info`.** `contact_info` is currently always empty. Owner uuids are still shipped to every map client if the public SELECT policy allows those columns.
8. **`verify-captcha` returns the full inserted row**, including `edit_token`, and allows any origin.
9. **Hardcoded function URL** can drift from `NEXT_PUBLIC_SUPABASE_URL`.
10. **Admin flag cached in `sessionStorage`.** UI-only, but it can show admin tools after a role change until logout.
11. **No centralized error reporting.** Failures are `console.error`, `alert`, or inline form text.
12. **Nominatim is called from the browser** with ~11 m coordinates (4 decimal places). Browsers generally strip a script-set `User-Agent`, so the header in `reverseGeocode.ts` may never be sent. Whether labels work in production **needs verification**.

---

## 7. Technical implementation status

| Area | Status |
| --- | --- |
| Automated tests | **Not found.** No `test` script, no `*.test` / `*.spec` files, no CI workflow. |
| Error monitoring | **Not found** (no Sentry or equivalent). |
| Analytics | **Stub.** `track()` logs `console.debug` via `browserAnalytics`. Events are named (`report_created`, `sighting_created`, `report_viewed`, `report_resolved`, `nearby_viewed`, walking mode, `map_focus_used`) but not sent to a product. `src/lib/analytics/`. |
| SEO | Root metadata only (`app/layout.tsx`): title “Lost & Found Pets Map”, short description, manifest, icons. No per-report `generateMetadata`, Open Graph, sitemap, or `robots.txt`. |
| Accessibility | Mixed. Feed and detail use some `aria` and button types. Map popups, sighting modal, admin sightings, and flagging use `prompt` / `alert` and clickable controls without a full accessible structure. Leaflet popups are a known weak spot. Not a completed pass. |
| i18n | **Partial.** `en`, `nl`, `fr`. Choice stored in `localStorage` key `lost_pets_lang`, else the browser language, else English (`I18nProvider`). Legal pages, sighting modal, sighting detail, edit page, nearby/walking copy, and admin sightings stay English. |
| PWA | **Implemented** for production builds. `sw.js`: precaches `offline.html`, manifest, icons. Navigations are network-first with offline fallback. Static assets (`/_next/static`, icons, css, js, woff2) are cache-first. `skipWaiting()` + `clients.claim()` — a new worker takes over without an in-app “update available” prompt. Push and notification click handlers live in the same worker. Dev mode does not register the worker. |
| Android | **Not found** as an app. Mobile is responsive web + PWA. |

---

## 8. External integrations and data sources

| Service | Use | Operational in this repo? |
| --- | --- | --- |
| Supabase (Auth, Postgres, Realtime, Storage, Edge Functions) | Entire backend | Client and two functions are wired. Live project state needs verification. |
| hCaptcha | Report submit | Client widget + server verify. Keys must be configured. |
| OpenStreetMap tiles | All maps | Called directly from the browser. No API key. |
| Nominatim | Coarse place labels | Called directly from the browser. No server proxy. |
| Web Push (VAPID) | Optional owner alerts | Code complete; webhook attachment not in repo. |
| Google Maps | Admin “open in Google Maps” link only | A URL, not an API integration. |
| Animal shelters, municipalities, other lost-pet platforms | — | **Not found.** |
| Import / export | — | **Not found.** No CSV, no sync job, no external database client. |

`lostpetsbelgium@gmail.com` appears as the privacy contact and the default VAPID contact (`app/privacy/page.tsx`, push function).

---

## 9. Current limitations and unfinished work

From the code, not a wishlist:

- **`/edit` does not edit.** It deletes. The detail page still labels the link as edit. `edit_token` / `edit_link` from the Edge Function do not match the page (`?token=` vs `?id=`).
- **`onReportCreated` is unused**, so the home page refresh key never changes after submit (`ReportForm.tsx`, `app/page.tsx`).
- **Report form does not require type or animal** before POST. The Edge Function will insert whatever string it receives if the database allows it.
- **Contact field was removed from the UI** but the column and privacy/terms copy remain.
- **Sighting photos, GPS accuracy, and client timestamps are not submitted**, though columns are selected as if they exist.
- **`getApprovedSightings` does not filter by status or expiry.**
- **Admin cannot edit content**, cannot hard-delete from the admin UI, and does not see sighting photos. Reject does not notify. `removed` / `pending` sighting transitions have no buttons. Reviewer id is not stored.
- **No moderation audit log, no user report categories, no account deletion, no text search, no duplicate detection, no server expiry job.**
- **Two Edge Functions are missing from the repo** (`smooth-processor`, `flag-report`). Most RLS, storage policies, and the push webhook are missing too.
- **`react-leaflet-cluster` is unused.** Clustering is supercluster.
- **`mapCenterProvider.ts` and `userLocationProvider.ts` are not wired.** `docs/proximity-architecture.md` and `docs/native-readiness-audit.md` say so. Nearby logic is inlined in `NearbyAwareness`.
- **Proximity alerts (background, persisted, push) are documented as not implemented.**
- **Analytics provider is a console stub.**
- **`RealtimeDebug` is still mounted in production** (hidden) as the notification realtime listener.
- **Privacy page over-claims** relative to this code: public contact details, hashed IPs on every submit, duplicate detection, and editing report content.
- **Hardcoded Supabase function host** instead of the env URL.
- **Orphan public photos** if submit fails after upload.
- **i18n gaps** listed in section 7.
- **No tests and no deployment config** in the repository.

---

## 10. Final summary

### A. Implemented functionality

- Mechelen-centered Leaflet map with OSM tiles, zoom and bounds limits, lost pins vs found dots, animal colors, 100 m halos when zoomed in, supercluster clustering, and animal/lost-found filters. `src/components/map/Map.tsx`, `filters.ts`, `useSupercluster.ts`, `CirclesLayer.tsx`.
- Public report feed with the same filters plus active/resolved/all and mine/all, newest first. `ReportsFeed.tsx`.
- Report detail page with photo, coarse location, and owner resolve/delete. `app/report/[id]/`.
- Logged-in report creation: description, optional name, one photo, map pin, consent, hCaptcha, privacy offset, 120-day `expires_at`, `owner_user_id`, immediate `active`. `ReportForm.tsx`, `verify-captcha`.
- Client-side expiry hiding when `expires_at` has passed. `normalizeReportRow`.
- Sighting modal linked to a lost report, GPS or map pick, description, out-of-area warning, POST to `smooth-processor`. `SightingsModal.tsx`.
- Popup hides exact sighting coordinates from the general public and shows them to the owner and admins. `ReportPopup.tsx`, `ReportMarker.tsx`.
- In-app `sighting_approved` notifications, mark-all-read, unread badge, realtime reload. `src/lib/notifications.ts`, `NotificationsClient.tsx`.
- Optional Web Push opt-in, subscription storage, and a webhook function that pushes that one event type and drops dead endpoints. `pushNotifications.ts`, `send-push-on-notification`, push migration.
- Email magic-link login, session display, logout. `src/lib/auth.ts`, `app/login/page.tsx`, `SessionControls.tsx`.
- Anonymous browsing of map, feed, and report pages.
- Single-level admin UI: list reports, resolve, hide (`removed`), flagged queue with reasons, restore, approve/reject sightings, out-of-area highlight, admin map focus. `app/admin/*`.
- User “report this post” flow calling `flag-report`. `src/lib/flags.ts`.
- Realtime refetch for reports; refetch on tab focus and channel reconnect.
- Nearby list (500 m) and foreground Walking Mode with session distance. `NearbyAwareness.tsx`, `useWalkingMode.ts`.
- Coarse “Near …” labels via Nominatim, with cache and queue. `reverseGeocode.ts`.
- PWA manifest, production service worker, offline fallback, install button, push handlers in the worker.
- UI strings for en/nl/fr on the main chrome, with a language switcher.
- Static about, privacy, and terms pages.

### B. Partially implemented functionality

- **Sighting lifecycle.** Admin approve/reject and owner notification exist. Create path, default `pending` status, rate limits, and IP hash live in `smooth-processor`, which is not in the repo. Client queries named “approved” do not filter status.
- **Flagging.** The button and the admin queue exist. The write path and the status transition to `flagged` are outside the repo.
- **Push delivery.** Client opt-in and the function are in git. The database webhook that calls the function is not.
- **Report editing.** Owners can resolve and delete. They cannot change fields. `/edit` is delete-only. `edit_token` is unused by the UI.
- **Expiry.** A timestamp is stored and the client hides stale rows. The database status is not updated by a job in this repo.
- **Location privacy.** Honest clients offset report pins and show coarse labels. The server trusts client coordinates. Sighting pages can show exact points. Popup and detail page do not follow the same rule.
- **Moderation roles and enforcement.** One boolean, UI gating only. RLS for reports, sightings, flags, profiles, and notification INSERT is not in the repo.
- **Schema.** Only notification read/update policies and `push_subscriptions` are migrated here. Other tables are inferred.
- **i18n.** Three languages for the main UI; several flows remain English.
- **PWA updates.** A new worker activates immediately; there is no user-facing update prompt.
- **Analytics.** Event names are instrumented; the provider only logs to the console.
- **Admin sighting review.** Coordinates and text are reviewed; photos are fetched and not shown; no edit; no reviewer audit fields written.
- **Contact and privacy copy.** Legal pages describe contact details, IP hashes, and duplicate checks that the current UI and checked-in functions do not implement.
- **Nearby / walking.** Works in the foreground for the session. Seen-state is not persisted. Reference location providers are unused. Documented as frozen.

### C. Not implemented / not found

- Pre-publication approval of reports.
- Editing report text, photo, or location after submit.
- Sighting photo upload in the UI.
- Contact field on reports (column is written as empty).
- Duplicate detection.
- Text search.
- Account deletion, email change, password, profile page.
- Separate moderator vs administrator roles.
- Moderation action log.
- Notifications for new reports, rejections, flags, or anything other than `sighting_approved` (rejection/update push copy exists but is unused).
- Notification preference center beyond push on/off.
- Server-side rate limit on report insert (only captcha + a 30 s localStorage cooldown).
- Scheduled expiry or storage cleanup.
- PostGIS or other server-side geo queries.
- Import/export and any shelter, municipality, or partner-platform integration.
- Native Android (or iOS) app.
- Automated tests, CI, error monitoring, sitemap, per-page SEO.
- Next.js API routes and server actions.
- Source for `smooth-processor` and `flag-report`.
- Background proximity alerts (`docs/proximity-architecture.md` states they are not implemented).

### D. Architecture and product observations

The product that is actually built is a **Mechelen community map**: public lost/found pins, a card feed, magic-link ownership, immediate publication of reports, moderated sightings, owner notifications, and a small admin console. That loop is the thing to keep. Rebuilding the map, feed, auth, or the report/sighting split would discard working behavior rather than fill a hole.

Preserve these boundaries; they are deliberate in the code and in `docs/proximity-architecture.md`:

- Reports and sightings are different objects. Sightings always point at a lost report.
- `type` (`lost`/`found`) is not `status` (`active`/`resolved`/`removed`/`flagged`/`expired`).
- Public map shows active reports only. The feed can also show resolved ones.
- Exact sighting coordinates are treated as more sensitive than report pins in the popup (owner and admin only).
- Report pin storage is intentionally imprecise in the client.
- Walking Mode and the nearby list are foreground, session-scoped tools. They are not a notification system.
- Clustering, halos, and the Mechelen max bounds are presentation, not moderation. The tighter Mechelen box is only a warning.

The risky seam is everything **not in git**: base RLS, storage rules, `smooth-processor`, `flag-report`, and the push webhook. The UI assumes those pieces exist and are strict. Until they are exported into this repo or inspected in the Supabase project, “admins only” and “sightings stay pending” are product intent, not proven enforcement.

`docs/rls-migration-audit.md` should not drive new work. Identity in the current code is Supabase Auth. `owner_user_id` and `notification_events.target_user_id` are auth user ids for rows created by the current paths.

Highest-value facts for the next product decision:

- A lost or found report is **live as soon as captcha and login succeed**.
- “Edit” today means **delete or mark resolved**, not change the post.
- Sightings are the only moderated submission, and their create/flag functions are **outside this repository**.
- There is **one admin bit**, no audit log, and no second role.
- The map is a **full-table client load plus browser haversine**, not a geo database.

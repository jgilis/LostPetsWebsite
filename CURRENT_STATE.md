# Lost Pets Map — current product and functionality inventory

**This file is a 7 November 2026 inventory of commit `cdc62cf`.** It is not the live product.

**Live status (9 November 2026):** Vercel hosts the site and deploys from GitHub `jgilis/LostPetsWebsite`. Supabase project `dmubikdkyusadzqngapy`. Phase 0 is complete. **Phase 1 Discover is done** in this repository. Next work is Phase 2 Activity (`PRODUCT_PLAN.md` section 12, `PRODUCT_STRATEGY.md` section 7).

Phase 1 Discover is the home:

- Full-screen map; bounds-synced report cards (mobile sheet / desktop list). Marker or card tap highlights the card and opens a detail sheet over the map. It does not go to `/report/[id]`.
- **Android / PWA is map-first:** compact top bar, one Filters button (sheet for Status/Animal), collapsed legend, Walking Mode from a map control, and one report sheet with a compact Within 500 m filter (Off / map centre / my location). There is no separate Nearby overlay.
- **Desktop** stays map + list with Status/Animal/Within 500 m in the list header and no Walking Mode.
- **Found reports** are species-colored DOM circle markers (`discover-found-marker`, 44 px hit target, `zIndexOffset` above lost pins) in `ReportMarker.tsx`. They are not canvas `CircleMarker` paths.
- **Activity (Phase 2 slice 1):** the Discover map stays mounted under Activity/Help so the camera is unchanged after tab switches and after opening/closing a Discover detail sheet. The Activity list is the loaded reports inside those bounds, newest first. **Mine** ignores the area filter. No approved sightings or 14-day reunion events yet. **Help** is still the report form.
- `/sightings/[id]` exact-location visibility is separate debt, not Phase 2.

Live baseline: `PRODUCT_PLAN.md` section 15.

Do not use the sections below as the current hosting, Edge Function, or privacy story. They describe the pre-security tree.

---

**Original inspection date:** 7 November 2026  
**Original commit:** `cdc62cf7da5ed29653b36a38f29eea22ca6d7314` — `cdc62cf`, 3 June 2026, “patch gps walk”

This inventory was based on the frontend, the two then-checked-in Edge Functions, and the two then-checked-in SQL migrations. It does not assume a control works because a button exists.

**Status words used below**

| Word | Meaning |
| --- | --- |
| Operational | A complete code path exists in this repository and is wired to data. |
| Partial | Some of the path exists; a step is missing, external, or only client-side. |
| UI-only | A control or page exists, but it does not perform the action the label suggests. |
| Backend-only | Data or a function exists without a matching user flow. |
| Not implemented | No code path. |
| Needs verification | Depends on Supabase or another service that is not in this repository. |

Remote Supabase (live RLS, storage policies, the push webhook, and Edge Functions whose source is not here) was not queried.

`docs/rls-migration-audit.md` is **not** a description of this commit. Its body still documents a removed `owner_token` system. Current identity code uses Supabase Auth. See `src/lib/permissions.ts` and `src/lib/supabase.ts`.

---

## 1. Application overview

Lost Pets Map is a community web app for **lost and found pets in the Mechelen area**. A visitor can browse a bounded map and a card feed. A signed-in person can publish a lost or found report immediately. Anyone can submit a sighting against an existing lost report. An admin can hide or resolve reports, work a flagged queue, and approve or reject sightings. The report owner is notified in the app, and optionally by Web Push, when a sighting is approved.

It is a beta, not an official rescue service (`app/about/page.tsx`, `README.md`).

### Technology stack

| Layer | Implementation |
| --- | --- |
| UI | Next.js 16.2 App Router, React 19.2, TypeScript (`package.json`) |
| Styling | Tailwind CSS 4 plus a large block of custom CSS in `app/globals.css` |
| Map | Leaflet 1.9, react-leaflet 5, supercluster. `react-leaflet-cluster` is installed and unused |
| Data | `@supabase/supabase-js` browser client (`src/lib/supabase.ts`) |
| Captcha | `@hcaptcha/react-hcaptcha` plus Edge Function `verify-captcha` |
| Push | Web Push inside `supabase/functions/send-push-on-notification` |
| i18n | Hand-rolled dictionaries, not a library (`src/i18n/`) |

There are no Next.js API routes and no server actions. The browser talks to Supabase directly, except report creation, sighting creation, and flagging, which `POST` to Edge Functions.

### Frontend architecture

- `app/` holds routes. Most interactive pages are client components.
- `src/components/` holds map, report form, feed, sightings, admin, notifications, auth, nearby, and PWA UI.
- `src/lib/` holds Supabase helpers and pure geo/location code.
- `src/hooks/` holds admin gating, walking mode, Leaflet loading, and realtime recovery.
- Global providers in `app/layout.tsx`: analytics stub, i18n, user profile, visibility resync, realtime resync, notifications. Footer and service-worker registration sit outside the page.

Map and sighting maps are loaded with `next/dynamic` and `ssr: false` (`MapWrapper.tsx`, `SightingClient.tsx`) because Leaflet needs `window`.

### Backend architecture

| Piece | Where | What it does |
| --- | --- | --- |
| Browser Supabase client | `src/lib/supabase.ts` | Reads and writes with the anon key and the user’s JWT |
| `verify-captcha` | `supabase/functions/verify-captcha/index.ts` | Checks hCaptcha and the JWT, then inserts a report with the service role |
| `send-push-on-notification` | `supabase/functions/send-push-on-notification/index.ts` | Sends Web Push after a webhook. JWT verification is off; a shared secret is required |
| `smooth-processor` | Called from `SightingsModal.tsx`. **Source not in the repo** | Sighting insert |
| `flag-report` | Called from `src/lib/flags.ts`. **Source not in the repo** | User flag insert |

Checked-in SQL is only:

- `supabase/migrations/20260515120000_notification_events_auth_uid_read.sql` — owner-only SELECT/UPDATE on `notification_events`
- `supabase/migrations/20260515140000_push_subscriptions.sql` — `push_subscriptions` table and owner RLS

`reports`, `sightings`, `reports_flags`, `profiles`, and storage policies are **not** defined in this repository. Their columns are inferred from queries.

### Supabase services used by the code

Auth (email OTP), Postgres, Realtime (`reports`, `notification_events`), Storage bucket `report-photos`, Edge Functions. No `rpc()` calls. No PostGIS.

### Hosting and deployment

**Not defined in the repo.** No `vercel.json`, Dockerfile, or GitHub Actions workflow. `.vercel` is gitignored, which only shows the Vercel CLI may have been used. `next.config.ts` sets `allowedDevOrigins: ["127.0.0.1"]` and nothing else. README expects `npm run dev`, `npm run build`, and `npm run lint`.

Edge Function URLs are hardcoded to project ref `dmubikdkyusadzqngapy`, not `NEXT_PUBLIC_SUPABASE_URL` (`ReportForm.tsx`, `SightingsModal.tsx`, `src/lib/flags.ts`). Whether this commit is what production is running **needs verification**.

### PWA

Operational in production builds. See section 11.

### Devices and screen sizes

There is no native app and no device-specific build. The site is one responsive web app:

- Home content is capped at `max-w-6xl` (`app/page.tsx`).
- Feed cards tighten from a phone column (`max-w-lg`) toward `md` and `xl` (`ReportsFeed.tsx`).
- The report form becomes two columns at `md` (`ReportForm.tsx`).
- The map shell is `h-[65vh]`. Filter chips scroll horizontally.
- `Map.tsx` computes `isMobile` (`window.innerWidth < 640`) and **never uses it**.
- Walking Mode hides the title, tabs, and footer and stretches the map (`app/globals.css`, `body.walking-mode-active`).

There is no bottom navigation bar.

### Languages

`en`, `nl`, and `fr` (`src/i18n/config.ts`). Default is English. After mount, `I18nProvider` reads `localStorage` key `lost_pets_lang`, otherwise the browser language, otherwise English, and sets `<html lang>`.

Translated: home chrome, filters, feed, report form, login, footer, most admin report/flag copy, push messages.

Still English: about, privacy, terms, sighting modal, sighting detail, `/edit`, admin sightings page, nearby/walking panel, several popup strings (“I spotted this animal”, “Report this post”, “Name:”).

### Routes

| Route | Purpose | Who |
| --- | --- | --- |
| `/` | Map, feed, and report tabs. `?tab=feed\|report`, `?focus=<reportId>` | Public browse; report tab requires login to submit |
| `/login` | Email magic link | Public |
| `/report/[id]` | Report detail. `?from=map\|feed` controls the back link | Public read; owner actions if that user is signed in |
| `/edit?id=<reportId>` | Delete a report the signed-in user owns. Does not edit fields | Auth + ownership |
| `/sightings/[id]` | One sighting: status, description, exact map point | No login gate in the page. Row visibility **needs verification** (RLS) |
| `/notifications` | List of approved-sighting alerts. Marks them read on open | Public URL; empty if signed out |
| `/admin` | Links to the three admin tools | `profiles.is_admin`, else redirect to `/login` |
| `/admin/reports` | Every report the client can read; resolve or hide | Same |
| `/admin/flags` | Reports with status `flagged`, plus flag reasons | Same |
| `/admin/sightings` | Every sighting the client can read; approve or reject | Same |
| `/about` | Beta explanation | Public |
| `/privacy` | Privacy copy | Public |
| `/terms` | Terms copy | Public |

Navigation is the footer (`SiteFooter.tsx`): Home/Map, Report (`/?tab=report`), Notifications, then language, PWA install, push, account. Legal links: About, Privacy, Terms. There is no header and no `/admin` link in the footer. Admins reach `/admin` by URL (`app/about/page.tsx` mentions it).

---

## 2. Public user experience

A visitor who is not signed in can use the product as a reader and, for two actions, as an anonymous submitter.

**What they see on `/`**

1. Title “Lost Pets Map — Mechelen”.
2. Three tabs: Map, Feed, Report (`app/page.tsx`).
3. On Map and Feed, animal chips (all, dog, cat, bird, rodent, other) and type chips (all, lost, found) (`ReportFiltersBar.tsx`).
4. Map of greater Mechelen, or the card feed.
5. Under the map, a “Nearby reports” panel (`NearbyAwareness.tsx`).
6. Footer.

The map loads every report the anon client is allowed to select, keeps active ones as markers, and subscribes to `reports` changes (`useReports`). Empty feed copy is “No reports yet in this area” (`src/i18n/en.ts`). That empty state is “no public reports at all”, not “none near the current map center”. The nearby panel is the location-aware list.

**Report details.** A popup on a marker shows type, species, optional name, description, and photo (`ReportPopup.tsx`). “View full report” goes to `/report/[id]?from=map`. The detail page shows photo, species, lost/found, name, coarse place label, timestamp, description, and the report id (`ReportDetailClient.tsx`). Contact details are not shown. The form always stores `contact_info` as `""`.

**Sightings.** On a lost report that the viewer does not own, the popup offers “I spotted this animal”. That opens `SightingsModal` with no login check. After a successful `POST`, the visitor gets `alert("Sighting submitted!")` and the modal closes. They do not get a confirmation page or a “my sightings” list. Whether the row is public before an admin approves it **needs verification** inside `smooth-processor`.

The public popup does **not** list exact sighting coordinates. If any sighting rows come back, non-owners see “This animal has recently been sighted nearby.” (`ReportPopup.tsx`). `/sightings/[id]` has no auth check and, if the row is readable, draws the exact point (`SightingClient.tsx`, `SightingMap.tsx`).

**Found animals.** “Found” is a report type on the Report tab, not a separate unidentified-animal flow. The same form publishes a found report. It is not a sighting, and it is not linked to an existing lost report.

**Filters.** Yes, client-side, on the already loaded list. No text search. No “search this area” geocoder. The map can be panned inside its max bounds. `/?focus=<id>` opens that report’s popup.

**Feed.** Public. Active reports by default. The visitor can switch to Reunited or All, and to “My reports”. “My reports” while signed out shows “Log in to see your reports.”

**Login-gated actions and what happens**

| Action | If signed out |
| --- | --- |
| Submit a report | The form shows a login banner (`reportLoginTitle` / `reportLoginCta` → `/login`). Submit still runs client checks, then `getUser()` fails and shows `reportErrorAuth` plus a login link. The Edge Function returns 401 without a Bearer token |
| Resolve, delete, or open `/edit` | Detail owner block is hidden. `/edit` says “Please log in” and links to `/login` |
| Notifications | The nav link works. The list is empty because `getAuthUserId()` returns null. Nothing redirects |
| Push opt-in | The control is not rendered (`PushNotificationControls` returns null without a user) |
| Admin URLs | `useAdmin` sends the browser to `/login` |
| Submit a sighting | **Not gated** in the client |
| Flag a post | **Not gated** in the client. `prompt()` asks for a reason |

There is no interstitial that saves the attempted report and resumes it after the magic link. The user returns to `window.location.origin` (`signInWithEmail` in `src/lib/auth.ts`).

---

## 3. Map and discovery

### Provider and libraries

OpenStreetMap raster tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (`Map.tsx`). The location picker adds the OSM attribution line. The main map does not. Libraries: Leaflet, react-leaflet, supercluster. Clustering is custom (`useSupercluster.ts`, `ClusterMarker.tsx`), not `react-leaflet-cluster`.

### Start position and zoom

`MapContainer` center `[51.025, 4.477]`, zoom 13, `minZoom` 10, `maxZoom` 16. Walking Mode raises max zoom to 18. `maxBounds` from `[50.75, 4.10]` to `[51.30, 4.80]` with viscosity 1, so the user cannot pan to a world map (`Map.tsx`). The report location picker uses a tighter box, `[50.90, 4.30]` to `[51.15, 4.65]`, zoom 11–16 (`LocationPicker.tsx`).

`src/lib/mechelenBounds.ts` is a still smaller box (lat 51.0–51.1, lng 4.4–4.5). It is a warning for admins and sighting submitters, not the map’s pan limit.

### Location detection

The main map does **not** ask for GPS on load.

- Walking Mode (`useWalkingMode.ts`) calls `watchPosition` only after the user turns it on. Foreground only. A fix older than 60 seconds is treated as stale. Follow mode pans the map; manual pan turns follow off; “Recenter” turns it back on.
- A sighting can call `getCurrentPosition` once (“Use my location”). Failure falls back to a message to pick on the map (`SightingsModal.tsx`).
- Nearby distances otherwise use the **center of the current map bounds**, not the device (`Map.tsx` `mapCenterLocation`).

### Markers

| Mark | When | Look | Click |
| --- | --- | --- | --- |
| Lost report | `type === "lost"` and status active | Standard Leaflet pin, color by species (`useMapIcons.ts`: blue dog, gold cat, violet bird, red rodent, black other) | Popup |
| Found report | `type === "found"` and status active | Colored dot, radius 8, plus an invisible radius-14 hit target (`ReportMarker.tsx`) | Popup on the invisible target |
| Cluster | Supercluster group | Grey circle with a count (`ClusterMarker.tsx`). Comment in that file says “temporary” | Zooms to the cluster expansion zoom |
| 100 m halo | Zoom ≥ 13.5, and not while `?focus=` is set | Translucent circle, `CirclesLayer.tsx`, not clickable | None |
| Sighting pin | `?focusSighting=` on the public map, or admin-scoped mode | Red pin (`useMapIcons.ts`) | No popup in `Map.tsx` |
| Walking position | Walking Mode with a fix | `WalkingModeMapLayers.tsx` | Recenter button |

Species colors are also the filter-chip borders. A small **display jitter** (`jitterCoords` in `useSupercluster.ts`) shifts drawn positions so stacked points separate. Stored coordinates are not changed.

`filterReports` (`src/components/map/filters.ts`) drops anything whose status is not `active`. Resolved, removed, flagged, and client-expired reports are not markers. Lost versus found is marker shape, not a status.

### Data loading

`useReports` selects `REPORT_PUBLIC_SELECT` for **all** reports, then keeps active and resolved for the public list (`isPublicFeedReport`). The map filters that list again to active. There is no bounding-box request and no reload when the user pans. Panning only changes which clusters are drawn from the in-memory set (`useSupercluster`).

Realtime: `postgres_changes` on `public.reports` refetches (`useReports`). Tab focus and channel reconnect also refetch (`VisibilitySyncProvider`, `RealtimeResyncProvider`, `useResilientRealtimeChannel`).

### Filters and search

Filters are operational and shared by map and feed: species and lost/found. They do not refetch. **No text search, no address search, no place autocomplete.**

### Nearby panel

Operational and separate from the pins. `getNearbyReports` (`src/lib/geo/getNearbyReports.ts`) keeps active reports within **500 m** of the map center, or of the GPS fix while Walking Mode has a fresh position. Sorted by distance. Labels from `proximityAttention.ts`: “Very close” under 75 m, “New nearby”, “Seen”. “Seen” lives in memory for the page session only (`proximityMemory.ts`) and is not saved or pushed. Copy is hardcoded English. Documented as a frozen foreground feature in `docs/proximity-architecture.md`.

### Popups

`ReportPopup` is a Leaflet popup, scrollable, max width 280 px (`app/globals.css`). Photo can open a lightbox (`PopupPhoto.tsx`, “Tap to enlarge”). Empty-map click closes popups (`MapClickCloser`). `/?focus=<id>` opens the matching popup (`useReportUrlFocus.ts`).

### Exact versus approximate

- **Stored report point:** the browser adds a random offset of ±0.00025° before submit (`applyLocationOffset` in `src/lib/location.ts`). The Edge Function stores the numbers it receives and does not offset them again.
- **Shown place:** `LocationDisplay` reverse-geocodes to “Near {neighbourhood or similar}”, or “Near Mechelen” (`reverseGeocode.ts`). It does not print raw coordinates to the public.
- **Sightings:** no offset. Exact coordinates are in the database. The popup hides them from non-owners. The sighting page and the admin list show them.

### Owner-specific map behavior

If `isOwner(authUserId, report.owner_user_id)`, the popup says the viewer reported it, hides the sighting and flag buttons, and shows exact sighting labels. Owners do not get a different marker.

### Admin map behavior

`/?mapMode=admin-scoped&focusReport=<id>&focusSighting=<id>` loads one report and its sighting points (`useReportSightings.ts`) and shows `AdminMapLegend`. Past sightings are red dots; the focused one is a red pin. The nearby panel is hidden. This mode is linked from `/admin/sightings` (“View on platform map”). It is not a separate map product. Admin styling of out-of-area reports is on the admin list, not a special public marker.

### What is visual only

- The 100 m halos. They are not a privacy radius and not a query.
- Cluster icon styling. The comment calls it temporary; the click behavior is real.
- `isMobile` in `Map.tsx`. Unused.
- `mapCenterProvider.ts` and `userLocationProvider.ts`. Not wired. Nearby logic is inlined in `NearbyAwareness`.

---

## 4. Missing and found pet reports

### Submission — operational, with client-side holes

**Who.** A signed-in user. `ReportForm` checks `supabase.auth.getUser()` and sends `Authorization: Bearer <access_token>`. `verify-captcha` rejects a missing or invalid JWT and sets `owner_user_id` to `user.id`.

**Fields the form actually collects** (`ReportForm.tsx`)

| Field | Required in the client? | Stored |
| --- | --- | --- |
| Type `lost` or `found` | The control starts empty. Submit does **not** require a choice | `reports.type` |
| Species dog, cat, bird, rodent, other | Same gap | `reports.animal_type` |
| Animal name | No | `animal_name` |
| Description | Yes, trim length ≥ 5 | `description` |
| One photo | No. `accept="image/*"`. No size or MIME check in code | Public URL in `photo_url` |
| Map point | A default Mechelen pin is already set, so “missing location” is hard to hit | Offset lat/lng |
| hCaptcha | Yes | Verified server-side, not stored |
| Consent checkbox | Yes. Not a cookie banner | Not stored |
| Contact | **No field** | `contact_info: ""` always |

The photo is uploaded to bucket `report-photos` **before** captcha and insert (`supabase.storage.from("report-photos").upload`, then `getPublicUrl`). A failed submit can leave a public file. Upload policies **need verification**.

**Server insert** (`verify-captcha`): status `active`, `edit_token` random UUID, `date_reported` now, `expires_at` now + 120 days, `owner_user_id` from the JWT. The function does not check species, type, length, bounds, or that `photo_url` belongs to the project. It returns the inserted row, including `edit_token`, and an `edit_link` of `/edit?token=...`.

**Spam controls that exist:** hCaptcha; a 30-second cooldown in `localStorage` key `last_submit_time` (this browser only). No server rate limit in the function.

**After submit.** A green panel offers “manage” (`/edit?id=<new id>`) and a button that switches to the map tab. `onReportCreated` is accepted by `ReportForm` and passed from `app/page.tsx`, and **never called**, so the home `refreshKey` does not change. The map updates if the realtime subscription fires.

Reports are **public immediately**. There is no pending state for reports.

### Management

| Action | Status | Where |
| --- | --- | --- |
| Edit text, photo, species, location, or type | **Not implemented.** `/edit` is delete-only. The detail page link is still labelled edit (`ReportDetailClient`, `app/edit/page.tsx` comment: “future edit”) | |
| Delete | Operational in the client | `ReportDetailClient.handleDelete` and `EditContent.handleDelete`: `.delete().eq("id").eq("owner_user_id", userId)`. RLS **needs verification** |
| Mark reunited | Operational in the client | Sets `status` to `resolved`. Copy: “Mark as reunited”. Removed from the map, still eligible for the feed |
| Reopen | **Not implemented** for owners. An admin can set a flagged report back to `active` (`AdminReportRow`, restore). There is no “un-resolve” button |
| Expiry | Partial | `expires_at` is written. `normalizeReportRow` locally relabels `active` to `expired` when that time has passed, and the map and feed then hide the row. No job in the repo updates or deletes the database row |
| Duplicate detection | **Not implemented** | The privacy page claims it. No matching code |
| `edit_token` | Backend-only remnant | Still written and returned. The edit page reads `?id=`, not `?token=`, since commit `f7754c1` |

### Display

**Map:** type via pin versus dot, species via color, popup content above. No contact line. Place names are coarse.

**Detail and feed:** photo or a species placeholder, name or species, lost/found, “Reunited” badge, “Your report” if the ids match, coarse location, `date_reported`, truncated description on the card, full description on the detail page, report id.

**Contact.** Not collected and not rendered. `contact_info` is still selected in `REPORT_PUBLIC_SELECT` (`src/lib/reports.ts`). If the public policy returns that column, clients receive an empty string today.

**Location privacy.** Honest clients offset the stored point. Labels avoid street numbers when Nominatim returns them (`looksLikeExactAddress` in `reverseGeocode.ts`). A modified client can send an exact coordinate, and the Edge Function will store it. Admins see raw coordinates to four decimal places.

### Lifecycle

1. Signed-in user submits. Captcha and JWT succeed. Row is `active`.
2. Map and feed show it. Realtime refetch picks it up for other open clients.
3. Others may flag it or, if it is lost, submit a sighting.
4. Owner may mark it reunited (`resolved`) or delete it. Admin may resolve it or set `removed` (shown as “hidden”).
5. After `expires_at`, open clients treat it as expired and hide it. The database status can stay `active`.

Closure does not delete the photo from storage.

---

## 5. Sightings

This is a second object, not a report status. A sighting always points at one lost report (`lost_report_id`). There is no flow for “I saw an animal that is not already listed.” That case is a **found report**, which is a different form and is not moderated in this repo.

### Journey that the code actually implements

1. Visitor opens a **lost** report popup and is not the owner.
2. “I spotted this animal” opens `SightingsModal`.
3. They choose GPS or a map click, optionally type “What did you see?”, and submit.
4. The browser `POST`s JSON to `smooth-processor` with `lost_report_id`, `latitude`, `longitude`, and `description`. No auth header, no captcha, no photo, no observed-at time, no GPS accuracy (the accuracy field exists on the type and is not sent).
5. On HTTP success: `alert("Sighting submitted!")`, modal closes, `track("sighting_created")` (console only).
6. An admin opens `/admin/sightings`, sees the row if RLS allows `getAdminSightings()`, and presses Approve or Reject.
7. `updateSightingStatus` (`src/lib/sightings.ts`) updates `sightings.status`. Only `approved` then inserts `notification_events` with `type: "sighting_approved"` and `target_user_id` equal to the report’s `owner_user_id`.
8. The owner’s open app refetches notifications. If they opted into push and the webhook is deployed, `send-push-on-notification` sends “Sighting approved”.
9. The owner opens `/notifications` or `/sightings/[id]`. The detail page shows description, status, and an exact map. There is no reply, no “this was my pet”, and no edit or delete of the sighting.

### What is and is not in the client

| Question | In this repo |
| --- | --- |
| Login required to submit? | No |
| Must it link to a lost report? | Yes. The only entry is a lost report’s popup |
| Unidentified animal? | No sighting path. Use a found report instead |
| GPS and manual pin? | Both |
| Observation date/time? | Not collected. `created_at` would be a database default. **Needs verification** |
| Description? | Optional textarea. No minimum length |
| Photo? | Column `photo_url` is selected later. The modal does not upload one |
| Captcha / validation? | Location required. Out-of-area is a warning, not a block. No captcha |
| Moderated? | The admin UI assumes a queue and writes `approved` or `rejected`. The insert that would set `pending` is **not in the repo**. Treat “starts as pending” as **needs verification** |
| Who sees the exact point? | Popup: admin or report owner (`canSeeExactSightings`). Everyone else: a generic sentence. `/sightings/[id]`: whoever can `select` the row, with no owner check in the page |
| Owner notified? | Only on approve, and only if `owner_user_id` is that user’s Auth id |
| Owner response? | No |
| Edit or delete a sighting? | No user UI. Admin can set status. `updateSightingStatus` also accepts `removed` and `pending`, but the page has no buttons for them |
| Sighting expiry? | `expires_at` is selected by `getApprovedSightings` and never filtered |

`getApprovedSightings` does **not** add `.eq("status", "approved")`. The name is ahead of the query. Which statuses the public can read **needs verification** (RLS).

Reject does not insert a notification. The push function contains unused copy for `sighting_rejected` and `sighting_updated`, then returns immediately unless the type is `sighting_approved`.

---

## 6. Moderator interface and workflow

**There is no moderator role.** The only privilege flag in the code is `profiles.is_admin`, a boolean read by `fetchIsAdminForUser` (`src/lib/profileAdminCache.ts`). About text calls this “admin” and describes moderation tasks. The same person gets every admin page. Nothing in the schema or UI grants a subset of those actions to a “moderator”.

If a product decision later splits the roles, that split does not exist yet. The matrix at the end of this section is therefore two columns: signed-in non-admin, and `is_admin`.

### How access is enforced

`useAdmin` (`src/hooks/useAdmin.ts`) waits for `UserProfileProvider`. If there is no user or `is_admin` is false, it sets `window.location.href = "/login"`. That is a **frontend redirect**. The admin pages then call the same Supabase client as everyone else (`getAllReports`, `updateReportStatus`, `getAdminSightings`, `updateSightingStatus`).

Whether Postgres actually refuses those updates for non-admins **needs verification**. The policies are not in this repo. A cached `is_admin` value also sits in `sessionStorage` until sign-out (`profileAdminCache.ts`), so the UI can stay open after a role is removed until the next login. The database is the real control, and it is not visible here.

There is no user-management screen, no way to grant `is_admin` in the app, and no row-level distinction between “review sightings” and “hide reports”.

### What the screens show

`/admin` is three links (`app/admin/page.tsx`): all reports, flagged reports, all sightings. No counts, no charts, no queue summary.

**Reports and flags** use `AdminReportRow`: species, type, status, truncated description, photo thumbnail that can enlarge (`AdminReportThumbnail.tsx`), coordinates, timestamp, id. Out-of-area coordinates get a red card and a warning (`isReportOutOfMechelen`). Flagged view adds flag count, up to five reasons, and the latest flag time. Lists are the full array, no search, no status filter, no pagination. Reports refresh on realtime `reports` changes (`useAdminReportsSync`). Sort for the main list is `date_reported` descending (`getAllReports`). Flags are grouped in the browser.

**Sightings** (`app/admin/sightings/page.tsx`, English only): coordinates to five decimals, linked species and name, distance from the report point, description, status text, time is not shown even though `created_at` is loaded. `photo_url` is selected and **not rendered**. No submitter email, no IP, no `reviewed_by`. `reporter_ip_hash` exists on the TypeScript type `AdminSighting` and is never selected. All statuses are in one list. No filter. No realtime subscription on this page. Sort is `created_at` descending.

Pending, approved, and rejected sightings are **not** split into tabs. The status is a colored label on each card.

Submitter identity for reports is `owner_user_id` inside the row, and the admin row **does not display it**. Sighting submitter identity is not shown.

### Actions, database effect, notice, reversibility, log

All of the following are available to `is_admin` only in the UI. None of them write an audit table. `reviewed_by`, `moderation_reason`, and `moderated_at` are not set by `updateSightingStatus`.

| Action | Database write in this repo | User notified? | Reversible in the UI? |
| --- | --- | --- | --- |
| Resolve report | `reports.status = resolved` via `updateReportStatus` | No | No un-resolve button. Feed can still show it |
| Hide report (“Remove”) | `reports.status = removed` after `confirm` | No | Not from the all-reports page. Flagged page can restore to `active` |
| Restore flagged report | `status = active` | No | Can be flagged again only if something sets `flagged` |
| Keep flagged | `status = flagged` | No | Yes, by resolving, hiding, or restoring |
| Approve sighting | `sightings.status = approved`, then insert `notification_events` | Yes: in-app, and push if configured | Can press Reject afterwards, which does **not** send a correction notice |
| Reject sighting | `sightings.status = rejected` | No | Can press Approve afterwards |
| Delete a row | **Not in the admin UI** | | Owner delete is a separate path |
| Edit report text or photo | **Not implemented** | | |
| Mark reunited | Same as resolve | No | |
| Remove from the active map | Resolve or hide both leave the map, because the map keeps only `active` | | |
| Suspicious links | **No link field and no link scanner** | | Descriptions are React text, so they are not rendered as HTML |
| Image review | Admin can open the report photo. No approve/reject of the image itself. No scan | | Sighting images are not shown |
| Spam / duplicates | No duplicate tool. Captcha is only on report create | | |
| User flags | Queue appears only for rows already `status = flagged`. Reasons come from `reports_flags` | The flagger gets an `alert`. The owner is not notified | Restore, hide, or resolve |

`flag-report` is what would create the flag and, presumably, set `flagged`. That function is not in the repo. **Needs verification.**

### Abuse controls that exist

- hCaptcha on report submit only.
- 30-second localStorage cooldown on report submit.
- Supabase’s own magic-link rate limit, surfaced on the login page (copy says 2 per hour; that limit is not set in this repo).
- Mechelen-bounds warning, not a block.
- Client minimum description length of 5 characters.
- User flag via `window.prompt` (`ReportPopup` → `flagReport`).

Not in this repo: upload inspection before publication, MIME/size enforcement, image moderation, link denylist, duplicate detection, IP hashing (claimed on the privacy page; only an unused TypeScript field here), rate limits on sightings or flags, audit log.

### Permissions matrix

“Enforced in the database” means a policy in **this** repository. Remote policies may be stricter. That column is therefore “not in repo” rather than “no”.

| Capability | Visitor | Signed-in user | `is_admin` | Database rule in this repo |
| --- | --- | --- | --- | --- |
| Browse map and feed | Yes | Yes | Yes | Not in repo |
| Open report detail | Yes | Yes | Yes | Not in repo |
| Submit report | No | Yes | Yes | Insert is service role inside `verify-captcha` after JWT |
| Edit report fields | No | No | No | |
| Delete own report | No | Client yes | Client yes, if they own it | Not in repo |
| Mark own report reunited | No | Client yes | Client yes, if they own it | Not in repo |
| Resolve or hide any report | No | UI no | UI yes | Not in repo |
| Submit sighting | UI yes | UI yes | UI yes | Insert function not in repo |
| See exact sighting in the popup | No | Only if they own the report | Yes | Not in repo |
| Approve or reject sighting | No | UI no | UI yes | Not in repo |
| Flag a report | UI yes | UI yes | UI yes (button hidden on own popup) | `flag-report` not in repo |
| Read own notifications | Empty | Yes | Yes | SELECT/UPDATE `auth.uid() = target_user_id` |
| Manage push subscription | No | Yes | Yes | `push_subscriptions` owner policies |
| Open `/admin/*` | Redirect to login | Redirect to login | Yes | Not in repo |
| Grant admin or manage users | No | No | No UI | Not in repo |

---

## 7. Administrator functionality

Administrators are the `is_admin` users from section 6. There is no second dashboard.

| Route | What it actually does |
| --- | --- |
| `/admin` | Three links. No stats |
| `/admin/reports` | All readable reports. Resolve. Hide (`removed`) |
| `/admin/flags` | Flagged reports and reasons. Resolve, hide, restore, keep flagged |
| `/admin/sightings` | All readable sightings. Approve, reject, open the scoped map, open Google Maps |

Not present:

- User list, ban, or delete account
- Promote or demote admins
- Analytics dashboard (events only `console.debug` in `browserAnalytics.ts`)
- Configuration screen (bounds, captcha, expiry, and copy are code or env)
- Database console, import, or export
- Moderation log
- Sighting photo review
- A link to `/admin` in the main navigation

`getAllReports` omits `contact_info` and `owner_user_id` from its select list. The admin report card cannot show the owner email because the email is never queried.

---

## 8. Activity feed

The feed is a **report list**, not an activity stream. `ReportsFeed.tsx` uses the same `useReports()` query as the map.

| Event type | Shown? |
| --- | --- |
| Active lost reports | Yes, default lifecycle filter |
| Active found reports | Yes |
| Reunited (`resolved`) | Only when the user picks Reunited or All |
| Sightings | No |
| Approvals, rejections, flags | No |
| Expired, removed, flagged | Hidden by `filterFeedReports` |

**Sort:** `date_reported` descending. Missing dates sort last.

**Filters:** species and lost/found from the shared bar; Active / Reunited / All; All / My reports. “My reports” compares `user.id` to `owner_user_id`.

**Paging:** none. The card list scrolls inside a `65vh` panel. Scroll position is saved in memory when opening a report and restored on return (`src/lib/reportNavigation.ts`).

**Realtime:** yes, because `useReports` refetches on `reports` changes. The feed is not a separate channel.

**Location:** cards show a coarse place label. The list itself is not limited to the map viewport or to 500 m. The nearby panel under the map is the location-aware list.

**Public:** yes.

**Interactions:** the whole card links to `/report/[id]?from=feed`. No inline resolve, share, or sighting button. Owners see a “Your report” badge. Reunited cards get a green treatment.

Empty states: no reports at all; no rows for the current lifecycle filter; no personal reports; not logged in for “My reports”; skeleton placeholders while loading.

---

## 9. Notifications and push

### In-app — operational for one event

`notification_events` rows with `type = "sighting_approved"` and `target_user_id` equal to the signed-in user (`src/lib/notifications.ts`).

- **Badge:** `NotificationNavLink` shows `unreadCount` from rows whose `read_at` is null. Cap display `99+`.
- **List:** `/notifications` (`NotificationsClient.tsx`). Copy: a sighting on your report was approved, coarse location if the payload has coordinates, timestamp, link to `/sightings/[id]`.
- **Mark read:** opening the page calls `markNotificationsAsRead()`, which sets `read_at` on **every** unread row for that user, then reloads. There is no per-item read control.
- **Realtime:** `RealtimeDebug` in the footer (UI hidden) listens for `INSERT` on `notification_events` and calls `loadNotifications` (`SiteFooter.tsx`). The subscription itself is not filtered by user; the follow-up query is. Visibility and reconnect also reload (`NotificationsProvider`).
- **Auth relationship:** `target_user_id` is the report’s `owner_user_id`. New reports set that to the Auth user id. RLS in the checked-in migration allows SELECT and UPDATE only when `auth.uid()` equals `target_user_id`. INSERT policies are explicitly not replaced by that migration and are **not in the repo**.

No other type is inserted by this repository. The list query also filters to `sighting_approved`, so other types would not show even if they existed.

### Web Push — code complete, delivery wiring needs verification

1. Signed-in user with a supporting browser sees Push on/off in the footer (`PushNotificationControls.tsx`).
2. Enable asks `Notification.requestPermission()`, registers `/sw.js` if needed, subscribes with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, and upserts `push_subscriptions` on `endpoint` (`src/lib/pushNotifications.ts`).
3. Disable unsubscribes and deletes the row.
4. `send-push-on-notification` expects `POST` with header `x-webhook-secret`. It loads subscriptions for `record.target_user_id`, sends a payload `{title, body, url}`, and deletes endpoints that return 404 or 410.
5. `public/sw.js` shows the notification and focuses or opens `data.url` on click.

The database webhook that should call this function is **not in the repo**. Secrets (`VAPID_PRIVATE_KEY`, `PUSH_WEBHOOK_SECRET`, service role) are not in git. If the public VAPID key is missing, the button reports “not configured”.

There is no preference center beyond on/off, no quiet hours, and no retry queue beyond the platform’s own push attempt. Duplicate events are not prevented: approving twice inserts two rows. There is no unique constraint in the checked-in SQL.

### Notification types

| Type | Inserted by this repo | Shown in the app | Push |
| --- | --- | --- | --- |
| `sighting_approved` | Yes, `updateSightingStatus` | Yes | Yes, if the webhook runs |
| `sighting_rejected` | No | No | Copy exists in the function and is skipped |
| `sighting_updated` | No | No | Same |
| New report, flag, resolve, reunite | No | No | No |

---

## 10. Accounts and personal functionality

| Feature | Status |
| --- | --- |
| Login | Operational. `/login` collects an email and calls `signInWithOtp` (`src/lib/auth.ts`). No password |
| Account creation | Same flow. Supabase creates the user on first magic link. No separate signup page. No profile form |
| Logout | Operational. `SessionControls` → `signOut()` → redirect `/` |
| Recovery | The magic link is the only recovery. No password reset |
| Profile | Footer shows the email address. No name, phone, or avatar |
| Own reports | Feed filter “My reports”. Detail page shows owner actions when ids match. Map popup shows “you reported this” |
| Own sightings | **Not implemented.** Sightings have no user id in the client payload |
| Notification settings | Push on/off only, and only when logged in |
| Language | Footer switcher, stored locally, not on the user row |
| Account deletion | **Not implemented** |
| Session display | `UserProfileProvider` tracks the Supabase session and `is_admin` |

`profiles` is read only for `is_admin`. The app does not create or edit profile rows. A trigger that inserts `profiles` on signup **needs verification**.

Ownership checks compare the Auth user id to `reports.owner_user_id` (`isOwner`). They are client checks plus `.eq("owner_user_id", userId)` on delete and resolve. They are not, by themselves, RLS.

---

## 11. Mobile, PWA, and desktop

The layout is a **responsive single column that widens**, not a separate mobile app.

- No bottom nav, no tab bar, no bottom sheet. The sighting UI is a centered fixed modal with inline styles (`SightingsModal.tsx`).
- Primary nav is the footer, which sits under the page. Walking Mode hides it.
- Map height is `65vh` (about `58dvh` in walking mode). Pinch and scroll zoom are Leaflet defaults (`scrollWheelZoom` is on).
- Filter chips are a horizontal scroller so six species fit on a phone.
- Report form stacks until `md`, then two columns.
- Feed cards use a 4:3 image on small screens and a wider ratio from `md`.
- Popups are width-capped against `100vw` and can scroll (`app/globals.css`).
- Admin pages are a `max-w-3xl` stack of cards. Usable on a phone, not a dedicated moderator layout.
- `isMobile` in `Map.tsx` is unused, so the map does not switch interaction mode by width.

### PWA — operational in production

| Piece | Behavior |
| --- | --- |
| Manifest | `public/manifest.json`. Standalone, any orientation, theme `#0a0a0a`, SVG icons |
| Registration | `ServiceWorkerRegistration` registers `/sw.js` only when `NODE_ENV !== "development"` |
| Install | `PwaInstallButton` appears after `beforeinstallprompt` and hides in standalone mode (`usePwaInstall.ts`). Chrome/Android can show this. iOS does not fire that event; there is no “Add to Home Screen” hint |
| Offline | Navigations are network-first. Failure serves `public/offline.html` (“You’re offline” and a reload button). The map, reports, and API are not cached for offline use |
| Cache | Precache: offline page, manifest, two icons. Same-origin static assets (`/_next/static`, icons, css, js, woff2) are cache-first. Other origins (OSM tiles, Supabase, Nominatim) are ignored |
| Updates | `skipWaiting()` and `clients.claim()`. A new worker takes over without an in-app prompt |
| Push | The same worker handles `push` and `notificationclick` |
| Installed vs browser | Same origin and same UI. Standalone hides the install button. No extra native APIs |

Android push works only as **Web Push inside Chrome or an installed PWA**, and only if VAPID and the webhook are configured. There is no FCM app.

---

## 12. Privacy, trust, and safety

| Topic | What the code does |
| --- | --- |
| Approximate report location | Client offset before save. Public label is “Near …”, not coordinates |
| Home address | There is no address field. A pin can still be placed on a house. The offset is small and client-side |
| Exact sightings | Hidden in the public popup. Shown to the owner and admins. Shown on `/sightings/[id]` if the row is readable |
| Contact info | Not collected. Privacy page still says optional contact details can be shown. That page is ahead of the form |
| Account data | Email lives in Supabase Auth. The UI shows it only to the signed-in user in the footer |
| Photo metadata | **Not stripped.** The file is uploaded as chosen. EXIF, including GPS, may remain inside a public object. **Needs verification** against the actual files |
| Privacy policy | `app/privacy/page.tsx`. Describes magic-link ownership, approximate locations, sightings, hashed IPs, and duplicate controls. Hashed IPs and duplicate detection are **not in this code** |
| Terms | `app/terms/page.tsx`. Short. Says private contact details are excluded from the public map. There is no contact field |
| Cookie / tracking consent | **No cookie banner.** The only consent checkbox is “I consent to sharing this report” |
| Captcha | hCaptcha on report submit |
| Moderation | Admin tools in section 6. Reports are public before any review |
| Abuse reporting | Popup “Report this post” → reason prompt → `flag-report` |
| Retention | Copy says content stays until expire, resolve, remove, or owner delete. Expiry is a client hide. Delete does not show a storage cleanup. Account deletion does not exist |

Trust gaps that are visible in the implementation:

- A report is public as soon as captcha and login succeed, including its photo.
- Sighting and flag endpoints are unauthenticated in the client.
- The sighting detail page can reveal a precise point that the popup deliberately hides.
- `verify-captcha` returns the full row, including `edit_token`, to any origin (`Access-Control-Allow-Origin: *`).
- `owner_user_id` is part of the public select list, so map clients receive the owner’s Auth user id if the policy allows that column.
- Legal pages over-claim controls that are not in the repository.

---

## 13. External services and integrations

| Service | Role | In the running path? |
| --- | --- | --- |
| Supabase Auth, Postgres, Realtime, Storage, Edge Functions | Entire backend | Yes, client and two functions. Live policies and the other two functions **need verification** |
| hCaptcha | Report submit | Yes, if both the site key and `HCAPTCHA_SECRET_KEY` are set |
| OpenStreetMap tile servers | All maps | Yes, from the browser, no key |
| Nominatim | Coarse labels | Yes, from the browser. Browsers usually drop a script-set `User-Agent`, so the header in `reverseGeocode.ts` may not be sent. Whether labels resolve in production **needs verification** |
| Web Push / VAPID | Optional owner alerts | Client and function are in git. Webhook **needs verification** |
| Google Maps | Admin “open in Google Maps” URL only | A link, not an API |
| Analytics | `track()` | Console debug only. No PostHog, Plausible, or gtag |
| Vercel | Hosting | Not configured in the repo. Default `public/vercel.svg` is an unused Next.js asset |
| Shelters, vets, municipalities, other lost-pet platforms | | **Not implemented.** No client, no import, no export |

Unused dependency: `react-leaflet-cluster`.

---

## 14. Current UX and UI inventory

This is a description of what is on screen, not a redesign.

### Visual language

- Page background `#0a0a0a`, text `#ededed`, cards `gray-900` with `gray-700` / `gray-800` borders. Tailwind gray scale plus blue-600 for primary actions and emerald for “reunited”.
- `app/layout.tsx` loads Geist Sans and Geist Mono. `body` in `app/globals.css` then sets **Arial, Helvetica, sans-serif**. The loaded fonts are not what the body uses.
- `:root` also defines a light background that the body background overrides. The app is dark regardless of `prefers-color-scheme`.
- Filter chips are an exception: white fill, thick colored borders, black or white text, uppercase. They sit on the dark page as a bright strip.
- Map popups and the sighting modal are **light** (Leaflet default white, modal `background: white`) on a dark app. Admin sightings and `/edit` mix Tailwind cards with inline styles. Notifications are a light card (`background: #fff`) on the dark page.
- Buttons are not one component. Variants include white-on-black submit, blue-600, red-600 flag, emerald resolve, gray underline footer links, and unstyled native buttons in the sighting modal.

### Patterns

| Pattern | Where | Behavior |
| --- | --- | --- |
| Cards | Feed, admin rows, login | Rounded border, dark surface. Feed card is the whole link |
| Forms | Report, login | Dark inputs, `gray-800`. Report is the large two-column form |
| Navigation | Home tabs, footer | Tabs are three equal text buttons. Footer is centered text links |
| Modals | Sighting report, photo lightbox, admin thumbnail | Sighting modal is a custom overlay, not a shared dialog. Lightbox is a fixed full-screen layer |
| Map markers | Leaflet pins and dots | Species color. Clusters are grey counts |
| Icons | Emoji in tabs, nearby, notifications, about copy | No icon set |
| Empty | Feed messages, admin “none”, notifications “empty” | Translated on the feed. English on admin sightings |
| Loading | “Loading…”, feed skeletons, admin “Checking access…” | Map returns `null` until mounted, then a text line |
| Errors | Form banner, `alert`, `prompt`, `console.error` | No toast system. Flagging and sighting submit use browser dialogs |

### Interaction problems that are visible in the code

- Three visual dialects: Tailwind dark pages, white Leaflet/sighting UI, and inline-styled edit and notification pages.
- “Edit” does not edit.
- The success link from the Edge Function (`?token=`) does not open the editor (`?id=`).
- Type and species can be submitted empty.
- Sighting and flag flows depend on `alert` and `prompt`, which are easy to miss and poor on mobile.
- No text search.
- Admin has no pending-only queue; approved and rejected sightings stay in the same list.
- Nearby and walking copy is English only, while the surrounding chrome is translated.
- Footer navigation is below a tall map, so Home / Report / Notifications are off-screen until scroll. There is no persistent bar.
- `isMobile` is unused, and walking mode is the only layout that changes structure for a task.
- The main map does not show OSM attribution; the picker does.
- Cluster markup is marked temporary.
- Privacy copy promises contact fields, IP hashes, and duplicate detection that the UI does not have.

---

## 15. Functionality matrix

| Feature | Implemented | Operational | Authentication required | Moderation required | Notes |
| --- | --- | --- | --- | --- | --- |
| Public map of Mechelen | YES | YES | NO | NO | Active reports only. Full list loaded, then clustered |
| Lost vs found markers | YES | YES | NO | NO | Pin vs dot |
| Species colors and filters | YES | YES | NO | NO | Client-side |
| Lost/found filter | YES | YES | NO | NO | Not a status filter |
| Text or address search | NO | NO | — | — | |
| Map focus URL | YES | YES | NO | NO | `/?focus=` |
| 100 m halos | YES | PARTIAL | NO | NO | Visual only, zoom ≥ 13.5 |
| Clustering | YES | YES | NO | NO | supercluster |
| Nearby list (500 m) | YES | YES | NO | NO | Map center or walking GPS. Session-only “seen” |
| Walking Mode | YES | YES | NO | NO | Foreground GPS only |
| Report detail page | YES | YES | NO | NO | |
| Card feed | YES | YES | NO | NO | Reports only |
| Feed reunited filter | YES | YES | NO | NO | |
| “My reports” | YES | YES | YES to see rows | NO | Signed-out empty state |
| Submit lost report | YES | YES | YES | NO | Public immediately after captcha |
| Submit found report | YES | YES | YES | NO | Same form. Not a sighting |
| Report photo | YES | PARTIAL | YES | NO | Public upload before the insert succeeds. No size/type enforcement in code |
| Report location pin | YES | YES | YES | NO | Client offset |
| hCaptcha on reports | YES | YES | YES | NO | Keys must be configured |
| Edit report fields | NO | NO | — | — | `/edit` deletes |
| Delete own report | YES | UNKNOWN / NEEDS VERIFICATION | YES | NO | Client query exists. RLS not in repo |
| Mark reunited | YES | UNKNOWN / NEEDS VERIFICATION | YES | NO | Owner or admin. RLS not in repo |
| Reopen a reunited report | NO | NO | — | — | Admin can restore a **flagged** report to active |
| 120-day expiry | PARTIAL | PARTIAL | NO | NO | Stored. Hidden in the client. No database job |
| Duplicate detection | NO | NO | — | — | Claimed on the privacy page only |
| Contact field | NO | NO | — | — | Column written as empty |
| Submit sighting on a lost report | PARTIAL | UNKNOWN / NEEDS VERIFICATION | NO | Intended | Create function `smooth-processor` is not in the repo |
| Sighting of an unknown animal | NO | NO | — | — | Use a found report instead |
| Sighting GPS or map pick | YES | YES | NO | NO | |
| Sighting photo | NO | NO | — | — | Column exists; modal does not upload |
| Sighting moderation queue | PARTIAL | UNKNOWN / NEEDS VERIFICATION | Admin UI | YES for approve/reject | Pending default not visible in this repo |
| Exact sighting hidden from public popup | YES | PARTIAL | NO | NO | Detail page does not apply the same hide |
| Owner notified on approval | YES | UNKNOWN / NEEDS VERIFICATION | YES to read | Approval | Insert policy and webhook not fully in repo |
| In-app notification list and unread badge | YES | YES | YES | NO | One event type |
| Mark all read | YES | YES | YES | NO | On opening `/notifications` |
| Web Push opt-in | YES | UNKNOWN / NEEDS VERIFICATION | YES | NO | Needs VAPID and a database webhook |
| Flag a post | PARTIAL | UNKNOWN / NEEDS VERIFICATION | NO | For the queue | `flag-report` not in repo |
| Admin resolve / hide | YES | UNKNOWN / NEEDS VERIFICATION | Admin | The action is the moderation | RLS not in repo |
| Admin approve / reject sighting | YES | UNKNOWN / NEEDS VERIFICATION | Admin | YES | |
| Separate moderator role | NO | NO | — | — | Only `profiles.is_admin` |
| User or role management | NO | NO | — | — | |
| Audit log | NO | NO | — | — | |
| Magic-link login and logout | YES | YES | — | NO | |
| Profile and account deletion | NO | NO | — | — | Email display and logout only |
| Language switch en/nl/fr | PARTIAL | PARTIAL | NO | NO | Main chrome only |
| PWA install, offline shell, push handler | YES | PARTIAL | NO | NO | Production build. Offline page only, not offline data |
| Shelter or municipal integration | NO | NO | — | — | |
| Analytics product | NO | NO | — | — | Console stub |
| Automated tests | NO | NO | — | — | |

---

## 16. Product observations and recommendations

These are separated from the findings above. They are not a redesign.

### A. Functionality to preserve

- The Mechelen-bounded map, species colors, lost pins versus found dots, and shared filters.
- The report / sighting split. A sighting is an observation on a lost report. A found animal is its own report.
- `status` (`active`, `resolved`, `removed`, `flagged`, `expired`) as a separate idea from `type` (`lost`, `found`).
- Immediate, owned publication of reports for signed-in people, with captcha.
- Owner reunite and delete, distinct from admin hide.
- Popup rule that the general public does not see exact sighting coordinates.
- Client offset plus coarse “Near …” labels for report locations.
- In-app `sighting_approved` notifications tied to the Auth user id.
- Foreground nearby list and Walking Mode as a search aid, not as a background tracker.
- Realtime refetch of reports, plus refetch when the tab returns.
- The three-language chrome for the main tasks.

### B. Functionality to improve

- `/edit` and the word “edit” describe a delete page.
- The Edge Function’s `edit_link` does not match the page.
- Report type and species are not required.
- Photos upload before the report exists, with no size or type rule in code.
- Sighting create and flagging cannot be reviewed from this repo, and the client sends no auth or captcha.
- `getApprovedSightings` does not filter status.
- `/sightings/[id]` shows an exact point with no owner check.
- Admin sightings are one mixed list, English only, without photos or a pending filter.
- Expiry only changes what the open browser displays.
- Footer navigation is easy to miss under the map.
- Light popups and modals on a dark UI, and three styling systems.
- i18n stops at the sighting, nearby, edit, legal, and admin-sighting screens.
- `onReportCreated` never runs, so submit does not locally refresh the map.

### C. Functionality that may be obsolete

- `edit_token` and `/edit?token=` after the editor moved to Auth user ids (`f7754c1`, `90d4357`).
- `contact_info` always sent as an empty string, while privacy and terms still describe it.
- `canViewSighting` is already deleted. Do not revive the token-based helpers in `docs/rls-migration-audit.md`.
- `react-leaflet-cluster` dependency.
- `mapCenterProvider.ts` and `userLocationProvider.ts`, unused by design in the proximity notes.
- Push copy for `sighting_rejected` and `sighting_updated`, which nothing inserts.
- `isMobile` in `Map.tsx`.
- `RealtimeDebug` as the production notification listener, with the debug UI turned off.
- `reporter_ip_hash` on the admin TypeScript type, never read.

### D. Missing relative to a location-aware community discovery product

These are gaps in the current direction, not a new product.

- No way to edit a live report.
- No sighting for an animal that is not already listed, except by filing a separate found report that is not linked to a search.
- No owner reply to a sighting.
- No text search and no “reports in the area I am looking at” feed. The feed is global; only the nearby panel is local.
- No moderator role distinct from full admin, and no audit trail.
- Reports are not reviewed before they go on the map.
- No account deletion, and no cleanup of photos when a report is deleted.
- No persisted proximity alerts. The nearby list is foreground and session-only, which the proximity doc already states.
- No partner data.

### E. Dependencies that should move together

- `owner_user_id`, `isOwner`, notification `target_user_id`, and push `user_id` are one Auth-user identity. Changing one without the others splits ownership from alerts.
- Map filters and feed filters share one state on the home page. A redesign of chips affects both.
- `useReports` feeds the map, the feed, and the nearby list. A query or status change hits all three.
- Popup sighting privacy and `/sightings/[id]` must be changed together, or the detail page undoes the popup.
- Approve in `updateSightingStatus` both writes status and inserts the notification. Splitting those without a replacement drops owner alerts.
- Walking Mode, nearby radius (500 m), and the 75 m “very close” rule are documented as frozen contracts in `docs/proximity-architecture.md`.
- Report `type` and report `status` drive different UI. Collapsing “found” and “reunited” would mix a category with a lifecycle.

---

## 17. Final executive summary

1. **What it can do.** Publish lost and found pet reports on a Mechelen map, browse them as cards, attach a sighting to a lost report, let an admin hide or resolve reports and approve or reject sightings, and tell the owner when a sighting is approved.

2. **A visitor without an account** can use the map, filters, nearby list, Walking Mode, feed, and report pages. They can submit a sighting and flag a post. They cannot publish a report, manage one, or read notifications.

3. **A registered user** can do all of that, plus publish a report, see “my reports”, mark their report reunited, delete it, read approval alerts, and turn Web Push on or off. They cannot edit the report’s contents or see a list of sightings they submitted.

4. **A moderator** is not a separate role. There is nothing a moderator can do that an administrator cannot, because the product only has `profiles.is_admin`.

5. **An administrator** can open `/admin`, `/admin/reports`, `/admin/flags`, and `/admin/sightings`; resolve or hide reports; restore flagged reports; approve or reject sightings; and open a scoped map. They cannot manage users, edit submission text, or see a moderation log in this app. Whether the database limits those writes to admins **needs verification**.

6. **Strongest existing pieces.** The bounded community map and feed, the lost/found visual split, Auth-owned reports, the sighting-on-a-lost-report flow, owner notifications, and the foreground nearby/walking tools.

7. **Biggest limitations.** Reports go live with no review. “Edit” does not edit. Sighting creation and flagging live outside the repo. There is no real search, no moderator/admin split, no audit log, and most RLS is not in git. The feed is not location-scoped.

8. **Preserve in a redesign.** The report-versus-sighting model, status versus type, public map versus owner-only exact sightings, coarse report locations, and Auth user ids as the only owner key. Do not rebuild those as a new ownership system.

9. **Issues that need attention before relying on the admin and privacy story.** Confirm remote RLS for report updates, sighting inserts, and notification inserts. Confirm `smooth-processor` and `flag-report`. Stop treating the privacy page’s IP-hash and duplicate claims as implemented. Align `/sightings/[id]` with the popup’s location rule. Photos are public and are not inspected or stripped in this code.

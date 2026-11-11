# Lost Pets Map — Product Plan

**Status:** Working product direction. Phases 0–5 are live in production. Magic-link draft keep is in this repository; text fields were checked after logged-out fill then login. Recheck pin and photo retention later. Custom SMTP is not set up yet (built-in Auth email stays at 2/hour until then). `/sightings/[id]` exact pin is owner/admin only; everyone else gets the coarse “seen nearby” treatment.  
**Scope:** Next version  
**Primary area:** Mechelen, Belgium  
**Languages:** English, Dutch and French

**Where to look**

| Need | Place |
|---|---|
| What to build next | This file, section 12 (recheck pin/photo draft; SMTP then lower the email cap). Later option: share a report, including visitors without an account. |
| Activity behaviour | `PRODUCT_STRATEGY.md` sections 5, 7 and 14 |
| Discover behaviour, layout, sheets | `PRODUCT_STRATEGY.md` sections 5, 6 and 14 |
| What is true in production | This file, section 15 |
| Full next-version spec | `PRODUCT_STRATEGY.md` |

---

## 1. Product vision

Lost Pets Map helps people notice, report and share useful information about missing and found animals in their local area.

The central experience is a map showing what is happening nearby. People should be able to understand the situation quickly, report something useful and help reunite animals with their owners.

**The product is about reliable local information, not social interaction.**

### Core principles

- Map first: the map is the heart of the application.
- Local and relevant: show information connected to the area people are exploring.
- Trustworthy: distinguish confirmed, pending and outdated information.
- Privacy-conscious: never expose precise locations unnecessarily.
- Simple: make the important actions easy to find.
- Accessible: work well on mobile, desktop and as an installed Android PWA.

## 2. What the product is — and isn't

Lost Pets Map is:

- A local map of missing and found animals.
- A way to report a missing or found animal.
- A way to share a sighting of an already-reported missing animal.
- A way to discover recent activity in an area.
- A way to receive alerts about new missing animals near places a user cares about.

Lost Pets Map is not:

- A social network.
- A shelter or municipal animal registry.
- A platform for public profiles, followers, likes, comments or private messaging.
- A game with points, badges or leaderboards.
- A background location tracker.
- A system that records people's movements.

## 3. Main navigation

The application has three main sections:

### Discover

The map-first experience. Opening the site lands here.

Users can:
- Explore missing and found animals on a full-screen (mobile) or split (desktop) map.
- Filter by animal species and report type (on Android, from a Filters sheet rather than always-visible chip rows).
- Browse the reports that fall inside the current map bounds, as cards synchronized with markers.
- Select a map marker or a report card: the matching card is highlighted, and details open in a sheet on top of Discover. The map is not left.
- Use Nearby (500 m) and Walking Mode on Discover.
- Start a report or sighting from Report (three-task chooser) or from a Discover sheet.

Discover’s list is **reports**, not an Activity event feed. Sightings and reunion events stay in Phase 2.

### Activity

A chronological overview of relevant local events.

It includes:
- New missing-animal reports.
- Found-animal reports.
- Approved sightings of missing animals.
- Recent reunions.

Activity is scoped to the area currently visible on the map.

A separate **Mine** view shows the signed-in user's own reports, regardless of the map area.

### Report

The place to contribute. The nav label is **Report** (not Help).

There are three primary actions:

1. **I lost a pet** — create a missing-animal report.
2. **I found an animal** — create a found-animal report.
3. **I spotted a listed pet** — submit a sighting linked to an existing missing-animal report.

Lost-pet reporting remains a core feature. It must not disappear as a consequence of the new navigation.

Users should also be able to reach relevant actions directly from the map, report details and empty states.

## 4. Reports and sightings

These are two different things and must remain separate.

### Reports

A report describes an animal situation:

- `lost`: an animal is missing.
- `found`: someone has found an animal.

Reports are created by signed-in users.

Ordinary reports are publicly visible after the required validation and abuse-prevention checks. They do not require routine administrator approval.

Report information includes:
- Animal type and species.
- Description.
- Approximate location.
- Optional photo.
- Optional animal name.
- Creation and expiry information.

### Sightings

A sighting describes an observation of an animal already listed in a missing-animal report.

A sighting:
- Must link to an existing lost report.
- Can be submitted without an account.
- Includes an observation location, time and optional description or photo.
- Starts as pending.
- Becomes publicly visible only after administrator approval.
- Notifies the report owner only after approval.

A sighting is not a replacement for a found-animal report. An unidentified found animal enters the map through a `found` report.

## 5. Users and accounts

There are three roles:

**Visitor**
- Can browse the map and Activity.
- Can use Nearby and Walking Mode.
- Can submit a sighting.
- Can flag a report.
- Later: can share a public report without an account (section 12).
- Cannot create or manage reports or save area subscriptions.

**Signed-in user**
- Can do everything a visitor can do.
- Can create and manage their own reports.
- Can mark their animal as reunited.
- Can save area subscriptions.
- Can manage their account and notification preferences.

**Administrator**
- Can review pending sightings and flagged reports.
- Can approve or reject sightings.
- Can moderate reports.
- Can access exact sighting locations where necessary.

Browsing should remain possible without an account. Do not introduce anonymous Supabase authentication as a shortcut.

If an action requires sign-in, preserve the user's draft when they go through the magic-link login process.

## 6. Map and location

The map remains based on Leaflet and retains the existing visual distinction:

- Missing animals: pins.
- Found animals: dots.
- Clusters: grouped markers when reports are close together.

The map camera should retain its position when users switch between Discover, Activity and Help.

Discover’s report cards follow the visible map bounds. Panning or zooming updates that list. Selecting a card highlights its marker. Tapping a marker selects and scrolls to the matching card, then opens a dedicated detail sheet over Discover. Do not navigate to `/report/[id]` for that gesture.

Nearby remains the existing 500-metre feature on Discover. Walking Mode is a first-class Discover mode (not Activity): foreground GPS only, reports prioritised by distance, normal Discover/Activity/Help navigation stays visible, and a clear prominent control exits Walking Mode.

Location principles:

- No background location tracking.
- No movement history.
- No public display of precise sighting coordinates.
- Public report locations should be approximate.
- Exact sighting locations are accessible only to the report owner and administrators.
- Location privacy must be enforced by the database or server, not just by hiding information in the interface.

The initial map remains focused on the Mechelen area. Reports outside the area can be highlighted for administrator attention.

## 7. Report lifecycle

Reports use these statuses:

| Status | Meaning |
|---|---|
| `active` | Currently relevant and visible |
| `resolved` | Animal has been reunited or situation resolved |
| `removed` | Removed from public display |
| `flagged` | Requires moderation attention |
| `expired` | No longer current |

An active report appears on the map and in Activity.

A resolved report disappears from the active map but remains in Activity for 14 days.

Reports expire after 120 days unless their status changes.

Owners should be able to edit an active report, including its description, photo and location. They should also be able to reopen a recently resolved report within 7 days.

Deleting a report must also deal with its associated stored photos.

## 8. Sightings and moderation

Sightings follow this process:

`pending → approved or rejected`

Pending sightings are visible to administrators, not publicly.

Approved sightings:
- Appear in Activity.
- Are shown on the relevant report.
- Notify the report owner.
- Display only approximate location information publicly.

Rejected sightings do not generate a notification to the submitter.

Administrators should have a simple review queue for:
- Pending sightings.
- Flagged reports.
- Reports outside the primary area.

Moderation actions should be recorded in an audit trail.

Ordinary reports should not be held for universal pre-approval.

## 9. Area subscriptions and notifications

Signed-in users can save up to approximately five areas they care about.

An area subscription includes:
- A location.
- A radius: 500 m, 1 km or 2 km.
- An optional species filter.

Initially, subscriptions generate alerts for new missing-animal reports only.

The notification system must distinguish between:
- Saving an area subscription.
- Enabling browser push notifications.

A user should be able to save areas even if push notifications are unavailable or disabled.

Existing owner notifications for approved sightings should remain.

## 10. Design direction

The application should feel calm, clear, welcoming and practical.

The map should remain the visual focus. Sheets and panels should present information without overwhelming it.

The interface should have consistent:
- Buttons and actions.
- Bottom sheets and desktop side panels.
- Loading and empty states.
- Error and confirmation messages.
- Map controls and filters.

The existing species colours and marker distinction should be retained.

The interface must work across mobile browsers, desktop browsers and the installed Android PWA.

English, Dutch and French should be supported throughout the main application, not just the main navigation.

Accessibility requirements include clear labels, keyboard support, visible focus states and touch targets of at least 44 px.

**Phase 1 and Phase 2 visual direction:** keep the existing dark styling. Do not redesign colours, type, or chrome. A later warm/light exploration is not this work.

## 11. Technical direction

Preserve the existing application and its architecture unless inspection shows a concrete reason to change them.

Current technology includes:
- Next.js App Router.
- React and TypeScript.
- Tailwind CSS.
- Leaflet and React Leaflet.
- Supabase Auth, Postgres, Realtime and Storage.
- Supabase Edge Functions.
- Web Push.
- Installable PWA support.

Do not:
- Rewrite the application in another framework.
- Build a separate native Android application.
- Introduce PostGIS unless actual performance or query requirements justify it.
- Add unnecessary infrastructure.
- Introduce social features or background tracking.

The live website is hosted on **Vercel**. Vercel deploys automatically from the GitHub repository. That hosting fact is confirmed by a successful production deployment of the Phase 0 frontend.

## 12. Development priorities

Work in small, reviewable phases. Complete and test each phase before starting the next.

### Phases 0–5

**Phase 0 — Security and foundations** (done)
- Sighting writes: force pending, active lost report only, hide exact coordinates, notify the owner on the server
- Close client report and flag inserts; tighten storage writes
- Owner identity for edit (`edit_token` gone); captcha-v2 submit

**Phase 1 — Discover** (done)
- Home shell: Discover / Activity / Report
- Bounds-synced report cards; detail sheet over the map (not `/report/[id]`)
- Map-first Android; desktop map + list
- Within 500 m, Walking Mode (phone), clickable found dots

**Phase 2 — Activity** (done)
- Slice 1: list follows the Discover camera; Mine ignores bounds
- Slice 2: approved sightings as coarse events (no public pin)
- Slice 3: 14-day reunions and Missing / Found / Sightings / Reunited filter
- Slice 4: open the report in Activity; View on Discover uses `/?focus=`

**Phase 3 — Report** (done)
- Slice 1: three-task chooser — lost / found / spotted a listed pet
- Slice 2: pending confirmation, observation time, private sighting photo
- Slice 3: owner photo + pin edit
- Slice 4: 7-day reopen (SQL first)
- Slice 5: flagging sheet (off `window.prompt`)

**Phase 4 — Area subscriptions** (live in production)
- Saved areas; alerts for new lost reports
- In-app notification list + existing push pipeline
- Deduplicate one notice per person per report, not per zone

**Phase 5 — Admin, expiry, cleanup** (live in production)
- Review-queue polish (counts, pending sightings, review photos)
- `moderation_actions` audit trail and `reviewed_by`
- Expiry job, duplicate hints, storage cleanup on delete

**After Phase 5 — Magic-link draft keep** (in this repository; text fields checked)
- Lost/found text fields survive email login and return the person to the filled Report form. Recheck pin and photo retention later (logged out → fill → magic link).
- Return path is stored in `localStorage` so a Site URL landing still opens Report. Custom SMTP is later; until then the built-in Auth email cap stays 2/hour. After SMTP, set emails/hour to 10 for development, then back to 2 or 3 before a wider launch.

### Phase 1 Discover — delivered

A new shell around the existing map, not a new map engine. Reused `Map.tsx`, `useReports`, filters, Nearby and Walking Mode. No new tables. No production security change.

- Home is Discover / Activity / Report. Discover owns center, zoom and filters.
- Mobile / PWA is map-first: compact top bar, Filters sheet, collapsed legend, Walking Mode from a map control, collapsed report sheet with Within 500 m (Off / map centre / my location). No Nearby overlay.
- Desktop is map + list, with Status / Animal / Within 500 m in the list header. Walking Mode is hidden.
- Report cards follow visible bounds. Marker or card select opens a detail sheet over Discover. Do not go to `/report/[id]`.
- Found reports are species-colored DOM circle markers (44 px hit target), stacked above lost pins. They are not canvas `CircleMarker` paths.
- Activity and Help are still the old feed and report form. That is Phase 2 and Phase 3.

Detail that was built: `PRODUCT_STRATEGY.md` sections 5 and 6.

### What to build next — Phase 2 Activity in the camera

Activity becomes a chronological list of **public facts in the Discover camera**, not a second copy of every report and not a social feed. Reuse loaded reports, Discover bounds (`reportInBounds`), species/lost-found filters, and the Phase 1 detail sheet. Do not add an activity table, PostGIS, or production schema unless inspection shows a real blocker and the user asks.

Detail: `PRODUCT_STRATEGY.md` sections 5 (camera travels), 7 (Activity) and 14 (build order).

Work and test one slice at a time. Each slice should be usable on its own.

**Slice 1 — Activity follows the Discover camera (reports only)**

- Persist Discover camera at the home shell: bounds, center, zoom, species filter, lost/found filter. Switching Discover ↔ Activity ↔ Help must not reset it. Switching repeatedly, including after opening and closing a Discover detail sheet, must keep the **same** Leaflet camera (center and zoom), not a reconstructed default. Keep the map mounted rather than unmounting `DiscoverWorkspace`.
- Replace the global `ReportsFeed` dump as the default. List **active lost and active found reports inside those bounds**, newest first.
- Reuse `filterReportsInBounds` / `reportInBounds`. Do not add a server bounding-box query.
- **Mine** stays and **ignores the area filter**. Owners are looking for their records, not the camera.
- Empty state: this map area has no recent activity; a Discover link lets people zoom out. The map camera stays where it was. Do not auto-zoom when opening Activity.
- Keep the existing feed cards as far as possible. Keep species and lost/found filters from Discover.
- Do not add sightings, reunion events, or a new event-type filter yet.
- Do not change Discover’s map-first Android chrome except to share camera state.

**Slice 2 — Approved sightings as Activity events**

Implemented in this repository.

- Mix **approved** sightings into the same list when the sighting coordinate falls inside the Discover bounds.
- Public copy is coarse place text only. No exact coordinates. No public sighting pin on Activity or Discover.
- Newest first among all event types already in the list.
- Inspect how approved sightings are already read. Reuse that path. Refetch when an approval lands. Do not build a separate activity table.
- Pending and rejected sightings stay hidden, as today.
- Do not change `/sightings/[id]` exact-location visibility (separate debt). Do not send public users there as a way to see an exact point.
- Do not change Phase 0 sighting privacy, RLS, or production database state unless a missing SELECT on approved public fields blocks this slice **and** the user asks.
- Public `sightings` SELECT still omits latitude/longitude. The area test and coarse “Near …” line use the linked lost report’s public point. Exact sighting pins stay off Activity and Discover.

**Slice 3 — 14-day reunions and event-type filter**

Implemented in this repository.

- Add **reunited** events: `reports` with `status = resolved` whose coordinate is inside the bounds, only for **14 days** after resolve. Then they leave Activity. The report detail URL can still open from an old link.
- Default Activity is the mixed area feed (missing, found, approved sightings, recent reunions). Drop “All lifecycle” as the default dump. Active / Reunited / All as today’s feed default is not the Phase 2 default.
- A filter may isolate Missing, Found, Sightings, Reunited.
- Mine still ignores the area filter and can still show the owner’s own resolved reports.
- Hidden, as today: `flagged`, `removed`, `expired`, pending sightings, rejected sightings.
- The 14-day window uses `reports.resolved_at`, stamped on `active` → `resolved`. Existing resolved rows with NULL `resolved_at` stay in Mine and stay out of the area reunion feed. The `resolved_at` column is live in Supabase; frontend SELECT of it ships with this repository.

**Slice 4 — Open on Discover**

Implemented in this repository.

- Tap an Activity event: stay in Activity and open the report there. **View on Discover** focuses that report (`/?focus=` already exists) and opens the Phase 1 detail sheet. Do not navigate to `/report/[id]` for this gesture. A new focus replaces any previously open Discover sheet.
- Mobile: Activity is a list with a clear way back to the map. The map may stay mounted and hidden; do not lose camera state.
- Desktop: keep the map visible if it can stay mounted (Activity as a list beside the map). If that is too large for this slice, persist camera and restore Discover on tap — do not remount a reset map.
- No like, comment, or share-to-followers. A system share of the report URL is fine.
- Implemented as Activity overlay + `/?tab=discover&focus=`: the map stays mounted; tap restores Discover and opens the Phase 1 sheet. Activity is not a side list beside the map in this slice.

**Keep**

- Discover as the map-first home from Phase 1. The Discover list stays **reports only**. Do not put Activity events into the Discover sheet.
- Nearby (Within 500 m) and Walking Mode on Discover. They are not Activity features.
- Mine on Activity.
- Existing dark styling, species colours, lost pin vs found dot, Mechelen bounds, PWA, en/nl/fr.
- Map camera when switching destinations. Discover owns center, zoom and filters; Activity reads them.
- Current Help / report form until Phase 3 slice 1 (now a three-task Report chooser).
- Public browse without an account.

**Do not**

- Add `activity` / event tables, PostGIS, or a native rewrite.
- Change Phase 0 security, RLS, captcha submit, sighting privacy, or production database state unless the user asks.
- Show exact sighting coordinates on Activity. Do not fix `/sightings/[id]` in this phase.
- Rebuild Help, photo/location edit, or 7-day reopen (Phase 3).
- Add area subscriptions, push for lost-in-area, or admin audit work (Phases 4–5).
- Move Walking Mode or Nearby into Activity.
- Redesign colours, type, or chrome.
- Unmount Discover in a way that forgets the camera.

**Out of this phase:** Help as three tasks, photo/location edit, 7-day reopen (3); area subscriptions (4); moderation audit, expiry job, duplicate hints (5); `/sightings/[id]` exact-location visibility (separate debt).

### Phase 3 Report — delivered

The destination label is **Report** (EN Report / NL Melding / FR Signaler), not Help. Internal URLs: `/?tab=report`; `/?tab=help` still maps to it. Flagging copy stays “Report this post”.

**Slice 1 — Three-task chooser (implemented in this repository)**

- Report screen asks only: I lost a pet / I found an animal / I spotted a listed pet. No extra landing copy.
- Lost and found reuse `ReportForm` with type preset. Login-before-publish banner stays. Do not rebuild the form.
- Spotted is a picker of active lost reports in the Discover camera, then the existing `SightingsModal`. Discover “I spotted this animal” skips the picker. Both paths call `submitSighting`.
- Keep the map mounted. Desktop Report overlay has extra top padding so the first chooser option is not flush with the destination nav.

**Slice 2 — Sighting confirmation, observation time, optional photo (implemented in this repository)**

- After submit: in-modal pending copy instead of `alert`. GPS/map/description/out-of-area warning stay.
- Observation time defaults to now and is editable. Optional photo is re-encoded, EXIF-stripped, and uploaded **after** the sighting row exists, to private bucket `sighting-photos`. Do not use `report-photos`. Do not accept a client `photo_url`.
- SQL is applied in production. `smooth-processor` is deployed with observation time and private `sighting-photos` upload.

**Slice 3 — Owner photo + pin edit (implemented in this repository)**

- Active reports: owner can replace the photo and move the pin on `/edit`. Name and description stay editable on active and resolved, as today.
- Photo is re-encoded and uploaded by `owner-update-report` (JWT required). Pin is offset on the server. The client does not write `latitude`, `longitude`, or `photo_url`.
- SQL in `supabase/migrations/20261111100000_owner_photo_pin_via_function.sql` is applied. `owner-update-report` is deployed with JWT verification on.

**Slice 4 — 7-day reopen (implemented in this repository)**

- Owners may set `resolved` → `active` within 7 days of `resolved_at`. The trigger clears `resolved_at`. After 7 days, or if `resolved_at` is NULL, they file a new report.
- SQL in `supabase/migrations/20261111140000_owner_seven_day_reopen.sql` is **not applied** until pasted in the dashboard. The client UPDATE only sends `status`; it does not write `resolved_at`.
- Reopen is on `/edit` and on the owner actions on the report. Photo/pin stay active-only.

**Slice 5 — Flagging sheet (implemented in this repository)**

- `window.prompt` is gone. A sheet lists spam / wrong animal / unsafe / other, plus an optional note, and still POSTs to `flag-report`. No account required. Owners do not see the control. The report owner is not notified.
- The button copy stays “Report this post”. After a successful flag, the sheet heading is “Thank you for reporting this post.”

Phase 3 is complete in production.

Magic-link draft keep is **not** a remaining Phase 3 slice. It is in this repository after Phase 5 (section 12).

### Phase 4 Area subscriptions — live in production

Signed-in users save a few named zones and get an in-app notice when a **new lost report** is first published in one. Found reports, sightings, reunions, edits, reopen, flag, and resolve do not create area notices. Detail: `PRODUCT_STRATEGY.md` section 9. Production has the SQL, the GitHub/Vercel UI, and `send-push-on-notification` v11. The existing INSERT webhook on `notification_events` is reused.

**Slice 1 — `area_subscriptions` table (live)**

- Table: owner, label, center, radius (500 m / 1 km / 2 km), species filter (NULL = all), on/off. Cap five zones per user, enforced with an advisory lock, not only the UI.
- Owner-only RLS. The browser does not insert `notification_events`.
- Haversine in SQL, inclusive radius. No PostGIS.

**Slice 2 — Save and manage zones (live)**

- Account → Alert zones. Pin on a small map or one-shot “use where I am now”. Login required. Saving a zone does not require browser push.
- On/off and delete. Disabling or deleting a zone stops future matches; it does not delete notices already created.

**Slice 3 — Match new lost reports and show them in-app (live)**

- `AFTER INSERT` on `reports` when type is lost and status is active. Covers `verify-captcha-v2` and legacy `verify-captcha`. Not UPDATE, so edits cannot notify again.
- One row per person per report: `DISTINCT ON (user_id)` plus unique index on `(target_user_id, payload report id)` where type is `lost_report_in_area`. Zone id is not part of the key. `ON CONFLICT DO NOTHING` for retries.
- Payload is report id, species, and coordinates rounded to 2 decimals (~1.1 km) so the in-app list can reverse-geocode a neighbourhood after the report is gone. No exact report pin, zone coordinates, or zone label. List link is `/?tab=discover&focus=`.
- In-app list and unread count include `lost_report_in_area` as well as `sighting_approved`. Push is not required for the in-app row.

**Slice 4 — Push on the existing pipeline (live)**

- `send-push-on-notification` also handles `lost_report_in_area`. Same webhook, same `push_subscriptions`. Title/body/url only; no coordinates.
- If the person has no push subscription, or send fails, the in-app row remains.
- Production function is version 11. JWT verification stays off.

**Keep**

- Public browse without an account. Zones need a real account.
- Owner sighting-approved notices, unread count, and mark-read.
- Discover camera, Activity, Report, Phase 0 security.

**Do not**

- Alert zone subscribers about sightings, found reports, or reunions.
- Use anonymous auth, PostGIS, background GPS, quiet hours, or a native rewrite.
- Fix `/sightings/[id]` exact-location visibility (separate debt).

### Phase 5 Admin, expiry, cleanup — delivered in this repository

Detail: `PRODUCT_STRATEGY.md` section 12. SQL in `supabase/migrations/20261111170000_phase5_moderation_expiry_cleanup.sql` is pasted in production. Do not run `supabase db push`.

**Slice 1 — Admin home as a queue** (in this repository)

- The first admin screen is counts, not “all reports”: sightings waiting, flagged reports, and active pins outside the Mechelen box.
- Each count opens that filtered list. All reports, all sightings, and the moderation log remain available; they are not the landing page.
- Same `is_admin` flag. No new role and no in-app user directory.

**Slice 2 — Sighting review with the evidence** (in this repository)

- The reviewer sees the photo, the note, when it was seen, and how far it is from the lost report, then Approves or Rejects. Pending is the default list.
- Approve/reject stamps `reviewed_by` and `moderated_at` in `enforce_sighting_write`. A rejected sighting stays silent to the owner.

**Slice 3 — A private paper trail** (live)

- One `moderation_actions` log: who, which report or sighting, what they did (approve, reject, hide, restore, resolve), when.
- Written by a `SECURITY DEFINER` trigger. Administrators can read `/admin/log`. It is not a public feed.

**Slice 4 — Time, duplicates, leftover cleanup** (live)

- `expire_due_listings()` sets overdue active reports and pending sightings to `expired`. Optional `pg_cron` after the extension is enabled. The public map already hides overdue rows in the client.
- Duplicate hint: same species, about 300 m, last 48 hours, on the report form and admin report cards. Submit is not blocked. Not a merge tool.
- Hard-delete of a report already cascades sightings; a new trigger removes `sighting-photos` objects, using the same `storage.allow_delete_query` pattern as report photos.
- `/sightings/[id]` exact-location visibility is unchanged.

### Magic-link draft keep — in this repository

Lost/found fields stay in `localStorage` (`lostpets.reportDraft.v1`) across the magic-link email. The intended return (`/?tab=report&task=lost|found`) is stored separately (`lostpets.authReturnTo.v1`) so Auth can land on the Site URL and the app still opens Report with the draft. Sightings still do not need an account. Captcha is not kept (one-use token). Do not bundle `/sightings/[id]` into this.

**Checked:** after filling a lost/found report logged out, then logging in, the text fields come back.

**Recheck later:** pin and photo after the same logged-out fill → magic-link login. They did not come back on the first check. The draft tries to store lat/lng and a small photo data URL; the map camera still opens on Mechelen, and large photos are dropped when they exceed the `localStorage` cap.

**Development auth email limit — SMTP later, then reduce again.** Login copy says 10/hour. That Dashboard field is Authentication → Rate Limits → “Rate limit for sending emails” (`rate_limit_email_sent`). Custom SMTP (or the Send Email hook) is **not set up yet**; the built-in Auth email service stays at **2/hour** until then. After SMTP, set that field to **10** for development, then **must reduce to 2 or 3 per hour again** before a wider launch. It is not an application table.

### `/sightings/[id]` exact-location visibility — in this repository

The detail page matches Discover/Activity. The exact sighting pin loads only for the report owner or an administrator (`canSeeExactSightings` + `sighting_exact_coordinates`). Everyone else sees “Seen nearby” plus the linked report’s coarse place, not a sighting map. Notifications and push may still open this URL; the page decides what to show.

### What to build next

Recheck pin and photo draft retention after a logged-out fill then magic-link login. Set up custom SMTP, then 10 emails/hour for development, later 2 or 3. Do not start other work until asked.

### Later option — share a report

A visitor without an account must be able to share a public lost or found report (system share and/or copy link). Signed-in users get the same control. This is not a social feature: no followers, no share-to-feed, no comments. Do not start until asked.

## 13. Explicitly out of scope

Unless we deliberately change the product direction, do not build:

- Public user profiles.
- Followers, likes, comments or messaging.
- Points, badges, streaks or leaderboards.
- Background GPS or geofencing.
- Location or movement history.
- Anonymous Supabase authentication.
- A moderator role.
- In-app administrator role management.
- Shelter or municipal database integration.
- Offline maps or offline personal data.
- A native application rewrite.

## 14. Decisions still requiring confirmation

These should not silently become permanent technical or product assumptions:

1. ~~Confirm Vercel as the hosting platform.~~ **Confirmed.** Vercel deploys the GitHub repository. The live site was checked after the Phase 0 frontend went Ready.
2. ~~Confirm that area alerts initially cover new missing-animal reports only.~~ **Phase 4 first release: new lost reports only.** Found is a later opt-in.
3. ~~Confirm that sightings remain possible without an account.~~ **Confirmed.** Logged-out submit was production-tested. The form still posts with no Authorization header.
4. Confirm that ordinary reports become public without administrator pre-approval.
5. ~~Confirm the 14-day visibility period for reunions.~~ **Phase 2: 14 days.** Then the reunion leaves Activity. The detail page can remain.
6. ~~Confirm the final visual direction.~~ **Phase 1 and Phase 2: keep the existing styling.** A later redesign is out of this work.
7. ~~Marker tap detail surface.~~ **Decided.** Select and scroll/highlight the matching card, then open a dedicated detail sheet over Discover. Do not navigate away from the map.
8. ~~Walking Mode chrome.~~ **Decided.** Keep Discover / Activity / Help visible. On Android, start Walking Mode from a compact map control; once active, show GPS/follow and distance and a clear Exit control. Hide Walking Mode on desktop.
9. ~~Legend.~~ **Decided.** Compact map legend; collapsed by default on Android so it does not obstruct the map.
10. ~~Android Discover crowding.~~ **Decided.** Map-first phone chrome: on-demand Filters, legend and Walking Mode; collapsed report sheet by default. Nearby is a Within 500 m filter on that sheet, not a second overlay. Do not change the desktop Discover layout for this.

### Outstanding technical debt (not Phase 5)

- **Recheck later:** after filling a report logged out, then logging in, confirm the **pin** and **photo** come back. Text fields already do. Captcha should not.
- Custom SMTP is not set up yet, so hosted Auth email sending stays at 2/hour. After SMTP, set “Rate limit for sending emails” to 10 for development, then reduce to 2 or 3 per hour again before a wider launch.

## 15. Live baseline

**As of 11 November 2026.** Mechelen beta on Vercel from GitHub `jgilis/LostPetsWebsite`. Supabase project `dmubikdkyusadzqngapy`. **Phases 0–5 are live in production** (Phase 5 SQL `20261111170000_phase5_moderation_expiry_cleanup.sql` is pasted). Magic-link draft keep is in this repository: return path in `localStorage`; text fields checked after logged-out fill then login; **recheck pin and photo later**. Custom SMTP not set up yet (built-in Auth email stays 2/hour); after SMTP, 10/hour for development then back to 2 or 3. `/sightings/[id]` shows the exact pin only to the owner or an admin; everyone else gets “Seen nearby”. Home is Discover / Activity / Report. Discover is map-first on Android, map + list on desktop, with bounds-synced report cards, a detail sheet over the map, compact legend, Within 500 m on the report list, Walking Mode on phone only, and clickable found-dot DOM markers. **Phase 2:** Activity follows the Discover camera (map stays mounted; Mine ignores bounds), mixes approved sightings (coarse place only; no public sighting pin; no `/sightings/[id]`), mixes 14-day reunions from `resolved_at`, and tapping an event opens the report in Activity; View on Discover uses `/?focus=` and the detail sheet. **Phase 3:** Report is lost / found / spotted; pending sighting confirmation, observation time, and private sighting photo; owner photo/pin via `owner-update-report`; 7-day reopen; flagging sheet (thank-you after submit, not `window.prompt`). **Phase 4:** named alert zones and one in-app notice per person per new lost report (`lost_report_in_area`), with coarsened coordinates for the place line; push reuses `send-push-on-notification` v11. **Phase 5:** admin home is a queue (pending sightings, flagged reports, out-of-area); sighting review stamps `reviewed_by`/`moderated_at`; `moderation_actions` log; duplicate hint (300 m / 48 h); `expire_due_listings()` and sighting-photo cleanup on hard delete. `/sightings/[id]` exact pin is owner/admin only.

### How production is updated

| Piece | How it is changed | Status |
|---|---|---|
| Next.js app | Push to GitHub; Vercel deploys automatically | Live |
| `smooth-processor` | `npx supabase functions deploy smooth-processor --project-ref dmubikdkyusadzqngapy --no-verify-jwt` | Deployed |
| `verify-captcha-v2` | `npx supabase functions deploy verify-captcha-v2 --project-ref dmubikdkyusadzqngapy` | Live; does not write `edit_token` |
| Database | SQL pasted in the production SQL Editor | Sighting/notification SQL, admin EXECUTE grant, Packages A–C SQL (owner SELECT and `edit_token` drop included), Phase 4 `area_subscriptions` and lost-in-area notify, Phase 5 moderation/expiry/sighting-photo. Do not run `supabase db push` |
| `owner-update-report` | `npx supabase functions deploy owner-update-report --project-ref dmubikdkyusadzqngapy` | Deployed |
| `send-push-on-notification` | `npx supabase functions deploy send-push-on-notification --project-ref dmubikdkyusadzqngapy --no-verify-jwt` | Live for `sighting_approved` and `lost_report_in_area` (v11) |
| Other Edge Functions | CLI deploy when explicitly done | Unused `verify-captcha` was redeployed with Package C. `flag-report` was not redeployed in this round |

There is no verified automatic Supabase–GitHub integration. Production does not have a trustworthy `schema_migrations` history for the full schema. The database cannot be rebuilt from this repository.

### What is live — preserve

- Lost and found reports; sightings linked to lost reports. Ordinary reports are public without pre-approval.
- Public browse without an account. Sightings can be submitted while logged out; they stay pending until an administrator approves them.
- Signed-in owners can edit name and description, replace the photo and move the pin on an active report, mark reunited, reopen within 7 days of `resolved_at`, permanently delete, and read their own hidden rows. Admin hide (`removed`) is not the same as delete.
- Exact sighting coordinates are not public. Owners and admins use `sighting_exact_coordinates`. Approval writes the owner notification on the server. Web Push on approval is verified.
- Report pins are offset server-side. Report photos are re-encoded, EXIF-stripped, and stored at public URLs. Hard delete removes the storage object; soft-remove keeps it.
- `edit_token` is gone. `/edit` uses `?id=` and `owner_user_id`.
- Leaflet map, clusters, species colours, Mechelen bounds, Nearby, Walking Mode, PWA, en/nl/fr, admin out-of-area highlighting.

### Implementation rule

Do not recreate existing functionality simply because it appears in a product requirement.

First inspect the current implementation, identify what can be preserved, and make the smallest safe change that achieves the desired behavior.

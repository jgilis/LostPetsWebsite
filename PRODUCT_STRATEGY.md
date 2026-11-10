# Lost Pets Map — next-version product specification

**Status:** product specification. Phase 0, Phase 1, Phase 2, and Phase 3 slice 1 are complete in this repository. Remaining Phase 3 slices and Phases 4–5 have not started.  
**Baseline:** live product as of 9 November 2026, hosted on Vercel from GitHub `jgilis/LostPetsWebsite`, Supabase project `dmubikdkyusadzqngapy`. `CURRENT_STATE.md` remains a 7 November inventory of the pre-security commit and is not the live baseline.  
**This document is the product direction.** What to build next is `PRODUCT_PLAN.md` section 12. What is true in production is `PRODUCT_PLAN.md` section 15. Where this spec and that status disagree on facts about the running system, the plan wins.

**Stack, unchanged:** Next.js 16, React 19, TypeScript, Tailwind 4, Leaflet, Supercluster, Supabase, Web Push, one codebase for the desktop site and the Android PWA, Vercel as the host. Vercel is confirmed by a successful production deployment from GitHub.

---

## 1. Product definition

### What the next version is

A **map-first, location-aware way for people in and around Mechelen to notice missing pets, share a useful observation, and hear about animals missing near places they care about.**

The unit of value is not a post. It is a **current, local, trustworthy fact**: this animal is missing near here, someone saw one like it near here, or this animal is home.

### What it is not

- Not a social network. No public profiles, followers, likes, comments, DMs, or a feed of people.
- Not a game. The Pokémon GO analogy is only about noticing what is around you and choosing to help. No points, streaks, collection, or competition.
- Not a shelter database, a vet network, or a municipal registry. Those stay out until a real partnership exists. None exists today.
- Not a background tracker. The app does not follow people when they are not using it, and it does not store a trail of where they have been.

### Jobs the product has to do

| Person | Job |
| --- | --- |
| Someone walking or browsing | See which animals are missing or were found around the area I am looking at, without an account. |
| Someone who recognises an animal | Attach an observation to the right missing-pet report, with as little ceremony as possible. |
| An owner | Publish a lost pet, hear when a sighting is accepted, mark the pet reunited, and take the report down. |
| Someone who found an animal that is not already listed | Publish a found report. That is a report, not a sighting. |
| A neighbour who wants to help over time | Subscribe to a few places (home, work, a drawn area) and get a push when a pet goes missing there. |
| An administrator | Keep the map accurate: review sightings, handle flags, hide abuse, resolve duplicates, and see what needs a decision. |

### Two objects, kept separate

This distinction is already in the product and stays.

| Object | Means | Created by | Public before review? |
| --- | --- | --- | --- |
| **Report** | An animal and its situation: lost or found | Signed-in owner | Yes, after captcha, as today. Change only the exceptions in section 8. |
| **Sighting** | An observation of an animal that is already on a **lost** report | Anyone, linked to that report | No. Public and owner-visible only after an administrator approves it. |

Do not merge them into one “pin” type. A found report is how an unidentified animal enters the map. A sighting is how the community adds evidence to a lost report.

`type` (`lost` | `found`) and `status` (`active` | `resolved` | `removed` | `flagged` | `expired`) stay different fields. “Reunited” is `resolved`. “Found” is not a synonym for reunited.

---

## 2. What to keep, change, or leave alone

| Keep and build on | Change in place | Leave until later, or drop from the UX |
| --- | --- | --- |
| Leaflet map, Mechelen bounds, species colors, lost pin vs found dot, supercluster | Make Discover a full-screen map with a bounds-synced report list (bottom sheet on mobile, side-by-side on desktop) | `edit_token` and `/edit?token=` (removed in Phase 0) |
| Magic-link accounts and `owner_user_id` = Auth user id | Bottom navigation on small screens; the map stays mounted | `contact_info` (always empty). Do not bring the field back |
| Report form, hCaptcha, photo bucket, client location offset, “Near …” labels | Sheets instead of `alert` / `prompt` | `react-leaflet-cluster` (unused) |
| Sighting linked to a lost report; GPS or map pick; pending until admin approval | Area-scoped activity, including approved sightings and reunions | Push copy for rejected/updated sightings (nothing inserts those types) |
| Owner notification on approved sighting (now a database trigger); Web Push pipeline | Area subscriptions as a new notification type on the same pipeline | Anonymous Supabase users (section 5) |
| `profiles.is_admin` as the only privilege | Admin home becomes a queue, same flag, no new role | A moderator role, user admin, public profiles |
| Nearby 500 m list and foreground Walking Mode | Keep both on Discover. Walking Mode sorts by distance, keeps normal nav, and has a prominent Exit control | Background geofencing and a movement history |
| en / nl / fr for the main chrome | Extend those three languages to Help, sightings, and admin | A fourth language |
| PWA manifest, service worker, install prompt | Same app installed and in the browser | A native rewrite |

**Do not rewrite the stack.** Leaflet still fits a bounded city map, cluster-on-the-client, and no PostGIS requirement yet. Supabase Auth, Realtime, Storage, and the existing push function are the notification backbone. A native app would split the “one codebase” constraint for no discovery gain. PostGIS is optional later if area matching becomes slow. It is not a prerequisite for Mechelen-scale data.

---

## 3. Roles

There are two account categories. Administrators moderate. There is no moderator.

| | Visitor | Signed-in user | Administrator (`profiles.is_admin`) |
| --- | --- | --- | --- |
| Browse Discover and Activity | Yes | Yes | Yes |
| Open a report | Yes | Yes | Yes |
| See exact sighting location | No. “Seen nearby” only | Only on reports they own | Yes |
| Submit a sighting | Yes | Yes | Yes |
| Publish or manage a report | No | Yes, their own | Their own, plus moderate any |
| Area-alert subscription | No. Subscriptions need a real account so they survive the device and can be turned off | Yes | Yes |
| Review flags, hide, resolve, approve or reject sightings | No | No | Yes |
| Manage other people’s accounts | No | No | No, and do not add it in this version |

Enforcement stays in Postgres RLS and Edge Functions, not in the React redirect. Sighting approve/reject, report writes, and flag reads are already limited in the database (Phase 0). The Discover shell must not weaken that.

There is still no in-app screen to grant `is_admin`. Keep granting it in Supabase. An in-app user directory is a social-admin tool this product does not need.

---

## 4. Account philosophy

### Visitors

Discovery is anonymous in the ordinary sense: no account, the Supabase anon key, public reads.

They can move the map, use filters, open reports, read Activity for the area, use Nearby and Walking Mode, and start a sighting or a flag. If they try to publish a report, subscribe to an area, or turn on push, the app asks for a magic link and returns them to the same map context afterwards. Today the magic link returns to the site origin and the draft is gone. The next version keeps the draft in `sessionStorage` until sign-in completes.

### Signed-in users

Magic link stays the only sign-in. It is already the account-creation flow. No passwords, no public profile.

They can publish lost and found reports, mark reunited, delete their report, submit sightings, see “mine” on Activity, manage area subscriptions, and turn push on or off. A simple account sheet shows the email, language, notification zones, and sign-out. It does not show a bio, a photo of the person, or their sighting history to anyone else.

“My contributions” is a private list: my reports, and my sightings if we start storing the Auth user id on the sighting. That list is not a profile other people can open.

### Anonymous Supabase authentication

**Do not use it in this version.**

Supabase anonymous sign-in creates a real `auth.users` row with no email. The JWT role becomes `authenticated`, not `anon`.

| Advantage | Why it is not worth it here |
| --- | --- |
| A sighting could be tied to a stable id without asking for email | The current product just finished moving off a second identity (`owner_token`). Anonymous users would be that second identity again |
| Push and “my sightings” could work before an email exists | Push and area alerts are explicitly account features. Owners of reports must be reachable by email magic link. Visitors do not need a stored identity to look at the map |
| Rate limits could key off a user id | A new anonymous user is cheap to create. It is a weak abuse key. Captcha, a server cooldown, and an IP hash inside the Edge Function are stronger and do not change RLS |

**Security cost:** policies written for `anon` (public read) versus `authenticated` (owner read/write) would start applying to every visitor who had been silently signed in. Notification SELECT is `auth.uid() = target_user_id`. Mixing anonymous uids into `owner_user_id` would recreate the bug the May 2026 migration removed. Clearing site data orphans the anonymous user; linking an email later is a second project.

**Revisit only if** we later need “these are my sightings” without email, and we are willing to treat anonymous users as a third, explicit class in RLS. Not before the area-alert work.

### What to do instead for low-friction help

Sightings stay available without an account. Abuse control for sightings is in `smooth-processor`: a cooldown and an IP hash that is never shown in the UI. The privacy page still over-claims the same hash for report submits; `verify-captcha` does not hash IP. Do not add anonymous Supabase users.

---

## 5. Information architecture

### Recommendation: Discover, Activity, Help

Use these three destinations. Account is not a destination. It is a sheet opened from the corner.

| Destination | Question it answers | Replaces |
| --- | --- | --- |
| **Discover** | What is going on around this map? | The Map tab, Nearby, and Walking Mode |
| **Activity** | What changed recently in the area I am looking at? | The Feed tab |
| **Help** | How do I add a fact? | The Report tab, the sighting modal, and the flag action’s dead ends |

**Why not keep Map / Feed / Report.** The live home is still three equal tabs under a title, inside `max-w-6xl`, at 65vh (`app/page.tsx`). Feed is a global report list, not tied to the map camera. Report is a publish form that cannot express “I saw the missing dog.” Those three tabs hide the product’s actual verbs: look, notice change, help. Discover / Activity / Help match the verbs without adding a fourth idea. The Discover list is the reports in view, not the Activity event feed.

**Why not two destinations.** Putting “report” and “sighting” only on map pins makes Help hard to find for “I found an animal that is not listed.” That case has no pin yet. Help is the front door for it. Pins remain the fast path for “I saw this one.”

### How the map context travels

Discover owns the map camera: center, zoom, species filter, lost/found filter. Activity and Help read that camera. They do not reset it.

- Activity lists events inside the current map bounds, newest first.
- Help, when offering “I saw a listed pet,” shows lost reports inside those bounds.
- Switching tabs does not unmount the map on mobile if we can avoid it. On a small screen the map is hidden but its state stays. On a large screen the map stays visible and Activity or Help opens as a side sheet.

This is the main structural change. It is a new shell around `Map.tsx`, `useReports`, and the existing report cards, not a new map engine.

### Desktop and installed Android PWA

Same routes, same components.

| | Narrow (phone, installed PWA) | Wide (desktop) |
| --- | --- | --- |
| Discover | Map-first full-screen map. Default chrome is a compact top bar (Filters button, icon Account and Notifications), a collapsed report-sheet handle with count and a compact Within 500 m control, and Discover / Activity / Help. Status and Animal filters, the map legend, and Walking Mode stay available on demand. The report sheet is the only report list. The sheet snaps collapsed / partial / full. Panning the map updates the cards to the visible bounds. | Map and a scrollable report list side by side. Status, Animal, and Within 500 m live in the list header. Walking Mode is hidden. Panning the map updates the list to the visible bounds. Card and marker selection stay in sync. |
| Activity | Existing global feed until Phase 2. Then: list of events in the Discover camera, with a way back to the map | Existing global feed until Phase 2. Then: event list; map can remain |
| Help | Existing report form until Phase 3 | Existing report form until Phase 3 |
| Navigation | Bottom bar: Discover, Activity, Help. Account icon at the top of the map | Same three as a slim top bar, so the map keeps the vertical space. No bottom bar |
| Admin | Separate `/admin` stack, linked from the account sheet only if `is_admin` | Same |

Walking Mode is a first-class Discover mode on phone / PWA, not a fourth tab and not part of Activity. Foreground location only. Reports in the sheet/list are prioritised by distance. Keep the normal Discover / Activity / Help navigation visible. On Android, Walking Mode starts from a compact map control; once active, show GPS/follow and distance with a clear Exit control. Do not show inactive Walking Mode copy on the default map. Hide Walking Mode on desktop. Recenter stays. Nearby is the existing 500 m filter on the same report list (Off, map centre, or my location), not a second overlay. Desktop keeps Within 500 m in the list header; Android keeps a compact Within 500 m control on the report sheet.

There is no hamburger full of features. If a control does not serve look, notice, or help, it goes in the account sheet (language, push, zones, sign-in, sign-out, about, privacy, terms).

---

## 6. Discover

### Purpose

The map is the product. Opening the site lands here. No marketing hero.

### What is on the map

Operational today and still correct:

- Lost reports: species-colored pins.
- Found reports: species-colored dots.
- Clusters with counts.
- Species and lost/found filters.
- Halos at close zoom only as a soft “area,” not as a privacy mechanism and not as a second marker. Keep them, label them in the legend as approximate area.
- `/?focus=<reportId>` selects that report on Discover (card + detail sheet), without leaving the map.

### What changes

**Mobile: map-first, with secondary controls on demand.** The primary Discover screen is a full-screen map. Default visible chrome is a compact top bar (one Filters button plus icon Account and Notifications), a narrow collapsed report-sheet handle with the report count and a compact Within 500 m control, and the Discover / Activity / Help bar. Status and Animal filters open in a bottom sheet; closing it keeps the selection. The map legend starts as a small control and expands only when tapped. Walking Mode stays available from a compact map control; active Walking GPS/distance appear only while Walking Mode is on. The report sheet is the only report list and snaps to collapsed, partial, and full height; selecting a report still opens the existing detail sheet, which takes priority over the list. Do not leave two filter-chip rows, an expanded legend, or a Nearby overlay on the map. Do not use the Leaflet popup as the way to browse reports.

**Desktop: map and list side by side.** A scrollable report list sits next to the map. There is no “selected report or Nearby” rail that replaces the list.

**The list follows the camera.** Panning or zooming updates the cards to the reports in the visible map bounds. Filter that list from reports already loaded for the map. Do not add a server bounding-box query in Phase 1.

**Cards and markers stay synchronized.** Selecting a card highlights its marker. Tapping a marker selects and scrolls/highlights the matching card, then opens a dedicated **detail sheet over Discover**. Do not navigate to `/report/[id]` or leave the map. Cluster tap still zooms, as today.

**Walking Mode stays on Discover (phone / PWA).** Foreground GPS only. Prioritise the in-view reports by distance. Keep the normal navigation visible. Provide a clear, prominent Exit Walking Mode control. Do not move Walking Mode into Activity. Do not hide the Discover / Activity / Help bar. Hide Walking Mode on desktop.

**Nearby stays on Discover as a filter on the same list.** Keep the existing 500 m behaviour (very-close under 75 m, session-only “seen”). It is not a second report overlay. Android: compact Within 500 m on the report sheet (Off, map centre, my location). Desktop: the same control in the list header. Do not persist “seen” across sessions. Do not turn it into push.

**No text search in Phase 1.** Filters and the map are enough.

**Legend.** Keep a compact map legend: pin = lost, dot = found, colours = species. On Android it starts collapsed as a small map control. On desktop it can stay open in the list/map chrome. Place it so it does not obstruct the map or report controls.

**Filters.** Same Status and Animal options, including rodent. Android: one Filters button with an active-filter summary; options live in a sheet. Desktop: Status and Animal menus in the list header. Do not keep two always-visible chip rows on the phone map.

**Visual styling.** Phase 1 keeps the current dark UI. No colour, type, or chrome redesign.

The Discover list shows **reports** only. Approved sightings and reunion events belong to Activity (Phase 2).

### Report detail

Reached from a selected card or marker as a **dedicated sheet over Discover**. The map stays underneath. Reuse `ReportDetailClient` content where possible. Do not route to `/report/[id]` for this gesture.

The sheet shows the same facts as today: photo, type, species, name, coarse place, time, description, owner actions when the viewer owns the report. Public viewers do not get exact sighting pins on Discover.

`/sightings/[id]` exact-location visibility is **not** Phase 1. It is outstanding technical debt (this file, Public precision; `PRODUCT_PLAN.md` section 14).

### Empty and denied states

- No reports in view: the map stays. The sheet or list says “Nothing active in this area.” It does not send people to a blank feed.
- Location denied: the map stays where it is. Walking Mode explains that it needs permission. Browse-by-pan still works. No modal loop.

---

## 7. Activity

### Purpose

A chronological list of **facts in the current map area**, not a social feed and not a second copy of every report card.

### What appears

Only public, current facts:

| Event | Source | Area test |
| --- | --- | --- |
| Pet reported missing | `reports` where `type = lost` and `status = active` | Report coordinate inside the Discover bounds |
| Animal reported found | `reports` where `type = found` and `status = active` | Same |
| Sighting confirmed | `sightings` where `status = approved` | Sighting coordinate inside the bounds. Display is coarse |
| Reunited | `reports` where `status = resolved` | Report coordinate inside the bounds |

Hidden, as today: `flagged`, `removed`, `expired`, pending sightings, rejected sightings. Those are admin material.

### How it differs from the current feed

`ReportsFeed` is every public report, newest `date_reported` first, with Active / Reunited / All and My reports. It is not tied to the map. It has no sightings.

Activity:

- Defaults to **the map area**, not the whole database.
- Mixes reports, approved sightings, and reunions.
- Drops the “All lifecycle” dump as the default. A filter can still isolate Missing, Found, Sightings, Reunited.
- “Mine” remains, and ignores the area filter, because owners are looking for their records, not the camera.

Sorting stays newest first. No infinite-scroll library is required at Mechelen volume: the same windowed list as today is enough. Realtime stays the `reports` channel plus a sightings refetch when an approval lands. Do not build a separate activity table until the four queries are actually slow. A database view can come later without changing the UI contract.

### Interactions

Tap an event to read it in Activity. View on Discover focuses that report (`/?focus=` already exists) and opens the sheet. A new focus replaces any previously open Discover sheet. No like, no comment, no share-to-followers. A system share of the report URL is fine and is not a social feature.

---

## 8. Help

### Purpose

One place that asks what the person knows, then runs the existing object for that answer.

### Three tasks

| Task | Object | Account | Notes |
| --- | --- | --- | --- |
| I lost a pet | Report `type = lost` | Required before submit. Draft can start first | Current form, with required type and species |
| I found an animal | Report `type = found` | Required before submit | This is the unidentified-animal path. Not a sighting |
| I saw a pet that is already listed | Sighting on a lost report | Not required | Picker of lost reports in the current area, then the same GPS-or-map step as `SightingsModal` |

From a Discover sheet, “I saw this animal” skips the picker and opens the sighting step for that report. Help and the sheet must call the same submit function so the rules cannot drift.

### Sighting step

Keep: GPS once, or pick on the map, short description, out-of-area warning that does not block.

Add:

- Optional photo, uploaded only after the server accepts the sighting, or uploaded to a **private** path and made public only on approval. Today report photos go to a public bucket before the insert succeeds. Do not repeat that for sightings.
- The time of the observation, defaulting to now, editable so “I saw it this morning” is not stored as the submit time.
- A clear pending state: “Thanks. An administrator will check this before the owner is notified and before it appears on the map.”
- No `alert`.

Do not collect a contact field.

### Report step

Keep captcha, consent, one photo, map pin, description, optional name, location offset, 120-day `expires_at`.

Fix before calling the form “redesigned”:

- Type, species, photo type/size/EXIF, and post-captcha upload are already enforced (Phase 0). Do not re-solve them here.
- After success, “manage” goes to `/edit?id=`. Name and description are editable. Photo and pin edit, and 7-day reopen, are Phase 3.
- `onReportCreated` already refreshes the map and feed after a successful submit. Keep that when Discover becomes the shell.

### Flagging

Move off `window.prompt`. A sheet with a short reason list (spam, wrong animal, unsafe, other) plus optional note, still calling `flag-report`. Flagging stays available without an account. The reporter is not notified. The administrator sees it in the queue.

---

## 9. Location and notifications

### Location rules

| Use | When | Stored? |
| --- | --- | --- |
| Pan and zoom | Always | No |
| Walking Mode and “use my location” for a sighting | User action, foreground, permission | The sighting point only, not the person’s track |
| “Set this zone from where I am” | One-shot read, user confirms the circle | The zone center and radius, not a history |
| Report pin | User places it | Stored after the client offset, shown as “Near …” |
| Sighting pin | User places it or GPS | Stored exact. Public UI shows coarse. Owner and admin see exact |

If permission is denied, every flow still completes by moving the map. No background `watchPosition` outside an active Walking Mode session. Walking Mode already clears when the fix is older than 60 seconds. Keep that.

Do not add a table of user locations. A subscription row is a place the user named, not a sample of where they were.

### Public precision

Keep `applyLocationOffset` but move the same offset **into `verify-captcha`** so a modified client cannot skip it. Keep Nominatim “Near {area}” and the rule that drops house numbers. Admin lists may keep raw coordinates. They are not public.

Sightings are not offset in storage, because the owner needs the real point. Precision is a **visibility** rule:

- Public map and Activity: no sighting pin. Text only.
- Owner of that lost report, and administrators: exact pin.

`/sightings/[id]` is **outstanding technical debt**, not Phase 1. The page can still show an exact point to whoever can load the row. Fix it separately (owner/admin only, or the same coarse public treatment). Do not change production for this during Discover.

### Area subscriptions

A signed-in user can save a few zones.

Each zone has a label they choose (“Home”, “Work”, or a custom name), a center, a radius (suggest 500 m, 1 km, 2 km), on/off, and species filter defaulting to all. They create it by dropping a circle on the Discover map or by one “use where I am now.” Cap at about five zones so push stays meaningful.

Matching:

- On insert of an **active lost report**, a database trigger or the existing insert function finds zones whose circle contains the stored point and whose species filter matches.
- For each match, insert `notification_events` with a new type, for example `lost_report_in_area`, `target_user_id` = the subscriber, payload = report id and coarse label. Not the raw coordinate if we can avoid it.
- The existing `send-push-on-notification` function already switches on `record.type` and already loads `push_subscriptions` by `target_user_id`. Extend that switch. Do not build a second push stack.
- The in-app list today filters to `sighting_approved` only (`getOwnerSightingsNotifications`). Widen it to the types we actually insert, with one row layout per type.
- Deduplicate: one event per (user, report, type). A unique index. Re-approving or re-editing must not push again.

**What does not push**

- Every sighting to zone subscribers. Too noisy, and it leaks that an animal was seen at a precise time near a precise place.
- Found reports in the first version of zones. The core promise is “a pet is missing near a place you care about.” Found can be a later opt-in.
- Reunions, except to the owner, which does not need a zone.

Owner sighting-approved push stays exactly as it is.

Delivery remains: insert `notification_events` → webhook → Edge Function → Web Push. In-app unread count and mark-read stay. The webhook definition is not versioned as a migration; it exists in production. Area alerts are not “done” until that webhook is real for both event types. Foreground only. No GPS in the push path.

Preferences live in the account sheet: master push switch (already built), list of zones, delete zone. No quiet hours in this version.

---

## 10. Report lifecycle

| State | Who sets it | On the public map | In Activity |
| --- | --- | --- | --- |
| `active` | Insert | Yes | Yes, while in view |
| `resolved` | Owner (“Mark as reunited”) or administrator | No | Yes, as a reunion, for a limited time (suggest 14 days), then it drops off Activity but the detail page can still open from an old link |
| `removed` | Administrator | No | No |
| `flagged` | Flag pipeline sets this | No, as today | No |
| `expired` | A scheduled job when `expires_at` passes. Today only the open browser relabels it | No | No |

**Edit.** Owners can change description, photo, name, and pin while `active`. Changing the pin runs the server offset again. They cannot rewrite history of approved sightings.

**Reopen.** An owner may set `resolved` back to `active` within 7 days if the reunion was a mistake. After that, they file a new report. Administrators can restore a flagged or hidden report to `active`, as the flagged screen already can.

**Expiry.** 120 days stays the default, set on insert as today. A Supabase scheduled function sets `status = expired`. The client rule in `normalizeReportRow` can stay as a backup, not as the only mechanism.

**Duplicates.** Do not silently merge. On submit, if an active report of the same species exists within about 300 m and 48 hours, show the owner or the founder the possible match and let them continue anyway. Administrators get the same hint on the report card so they can hide the duplicate. Automatic merge will attach sightings to the wrong animal.

**Closure story.** Submit → active on the map → optional approved sightings → owner marks reunited → pin leaves the map → Activity shows the reunion briefly → row remains for the owner. Delete still hard-deletes the row the owner owns and must also delete the storage object. That cleanup does not exist today.

---

## 11. Sighting lifecycle

1. Person submits against a lost report. Status `pending`. Not on the map, not in Activity, owner not notified.
2. Administrator approves or rejects.
3. Approve: status `approved`, owner notification (existing), Activity and the owner/admin map can show it, public copy is coarse.
4. Reject: status `rejected`, no notification (current behavior; keep it, so we do not tell owners about noise).
5. No public edit. The submitter can withdraw a **pending** sighting only if we stored their user id. Anonymous submissions cannot be withdrawn. That is an acceptable consequence of not requiring login. Say so in the pending confirmation.
6. Do not build a conversation on the sighting.

`getApprovedSightings` filters `status = approved` and does not select exact coordinates. Exact pins are loaded only through `sighting_exact_coordinates` for the report owner or an administrator.

---

## 12. Administration and trust

Same people, same flag, better queue. No new role. No user management.

### Admin home

Replace the three equal links with counts that are the job:

- Sightings waiting (`pending`)
- Flagged reports
- Active reports outside the Mechelen warning box (the highlight already exists on the card)

Each count opens the list filtered to that set. “All reports” and “all sightings” remain, but they are not the landing page.

### Sighting review

Show the photo (selected today, not rendered), description, observation time, distance from the lost report (already computed), map link (already there), and Approve / Reject. Record `reviewed_by` and `moderated_at`. The columns are already on the TypeScript type and are not written.

Reject stays silent to the owner.

### Report review

Administrators are not a gate on every honest report. Pre-moderation of all reports would fight “low-friction” and the current publish path.

Hold for review, instead, only when the risk is specific:

- Coordinate outside the usual Mechelen box (warn today, still publishes).
- Description contains a URL. Strip links from public text rather than rendering them. There is no link allowlist because there is no link feature. Keep it that way.
- Photo fails type or size checks. Reject the upload. Do not scan images with a third-party moderator in this version. The administrator can open the thumbnail, which already exists, and hide the report.

Spam: captcha stays on reports. Add server-side captcha or equivalent and a cooldown on sightings and flags inside the Edge Functions. The 30-second `localStorage` limit is not a control.

### Audit

One table, `moderation_actions`: who (`auth.uid()`), what (report or sighting id), action (approve, reject, hide, restore, resolve), when. Administrators can see it. It is not a public feed. Without this, the current tools are not reviewable after the fact.

### Images

Re-encode on upload. Public bucket only for photos that belong to an active, resolved, or approved public object. Pending sighting photos stay private. Hide and delete remove or detach the object. None of that cleanup exists today.

### Copy on the legal pages

Privacy and terms currently describe contact details, IP hashes, and duplicate detection that the code does not do. Either implement the control or delete the sentence. Do not leave the claim ahead of the product.

---

## 13. UX and UI plan

### Design intent

**Phase 1 keeps the existing visual styling.** Dark, map-first, current species colours. Do not redesign type, colour, or chrome. A later warm/light exploration is out of this phase.

Species colors stay (dog blue, cat amber, bird violet, rodent red, other neutral). They are already a legend. Do not add a second palette.

### Components to standardize

| Piece | Plan |
| --- | --- |
| Map chrome | Dark scrim. Android: compact Filters button and small map tools, not two always-visible chip rows. Desktop: Status/Animal menus in the list header |
| Discover list | Narrow: collapsed-by-default draggable bottom sheet of report cards, three snap positions, map visible behind it. Wide: scrollable list beside the map |
| Report detail | Dedicated sheet over Discover after card or marker selection. Map stays. Do not navigate away |
| Other sheets | Account (and later Help/sighting) can use a sheet. Do not merge them into the Discover report-card list |
| Primary button | One style. Blue is already the action color |
| Destructive | One style for delete and hide |
| Feedback | Inline sheet text. Retire `alert` and `prompt` |
| Empty | One sentence plus the next useful action |
| Loading | The feed skeleton pattern, reused. The map stays visible while reports refresh |
| Admin cards | The existing `AdminReportRow` is close. Add the queue filters. Do not invent a dashboard aesthetic |

### Map markers

Keep pin vs dot vs cluster. Keep a compact legend that says what they mean, placed so it does not cover map or report controls. Do not put exact sighting pins on the public Discover map.

### Writing

Short, concrete, in the existing three languages. Prefer “Missing,” “Found,” “Reunited,” “Seen nearby” over internal words (`resolved`, `removed`, `flagged`). Admin screens can say “hidden” for `removed`, as they already do.

### Accessibility

Sheet focus trap on the report-card sheet and the detail sheet, labelled icon buttons, visible focus, hit targets at least 44 px in the bottom bar. The map remains a known hard spot. The sheets are how keyboard and screen-reader users get the report without fighting Leaflet.

### PWA

Same UI installed or not. Install stays a quiet control, not a banner on first paint. Offline remains the existing offline page. Do not cache the map or personal data. Push permission is asked when the user turns on a zone or owner alerts, not on first visit.

---

## 14. Incremental build order

Each phase is usable on its own. None of them replaces Leaflet, Supabase, or the report/sighting model.

**Phase 0 — make the current promises true.**  
**Done.** Live baseline: `PRODUCT_PLAN.md` section 15.

**Phase 1 — Discover shell.**  
**Done.** Checklist that was built: `PRODUCT_PLAN.md` section 12 (Phase 1 delivered). Behaviour and layout: this file, sections 5 and 6.

Full-screen map. Android / PWA: map-first default (compact top bar, on-demand Filters / legend / Walking Mode, collapsed report-sheet handle with Within 500 m on the same list). Mobile sheet still has three snap positions, map visible behind it. Desktop: map and report list side by side; Booking-style Status/Animal and Within 500 m in the list header; Walking Mode hidden. List follows visible bounds. Card select highlights the marker. Marker tap scrolls/highlights the card and opens a detail sheet over Discover — do not leave the map. Compact legend, not covering controls. Walking Mode stays on Discover for phone: foreground GPS, sort by distance, **nav stays visible**, prominent Exit Walking Mode. Found reports are clickable DOM circle markers. Keep existing visual styling. Reuse `Map.tsx` and existing report cards. Help stays as the current report form until Phase 3. No new tables, no production database or security changes. `/sightings/[id]` exact-location visibility is separate debt.

**Phase 2 — Activity in the camera.**  
**Done** in this repository. Behaviour: this file, section 7. Next is Phase 3.

Activity lists public facts inside the Discover camera, newest first: active lost, active found, approved sightings (coarse place only), reunions for 14 days. Keep Mine (ignores the area filter). Persist camera when switching destinations. Tap an event to read it in Activity. View on Discover focuses that report and opens the detail sheet — do not go to `/report/[id]`. A new focus replaces any previously open Discover sheet. Mobile: list with a way back to the map. Desktop: map can remain. Reuse loaded reports and existing bounds helpers. No activity table, no PostGIS, no production schema/security change unless the user asks. Do not put Activity events into the Discover report sheet. Do not move Nearby or Walking Mode. Do not fix `/sightings/[id]`.

**Phase 3 — Help as three tasks.**  
The destination label is **Report**. Slice 1 is done in this repository: three-task chooser; lost/found reuse the current form; spotted uses a camera picker then the existing sighting modal; Discover skips the picker; both paths call `submitSighting`. Remaining: pending sighting confirmation without `alert`, observation time, optional photo, draft keep, photo/pin edit, 7-day reopen, flagging sheet.

**Phase 4 — zones and push.**  
`area_subscriptions`, match on new lost reports, new `notification_events` type, extend the push function and the in-app list, unique dedupe. Depends on the webhook actually being installed.

**Phase 5 — admin queue and audit.**  
Counts, pending-only sightings, photos on sighting review, `reviewed_by`, `moderation_actions`, expiry job, duplicate hint, storage cleanup on delete.

Phases 1–3 are mostly presentation and flow on top of tables that exist. Phase 4 is the first new product table. Phase 5 is remaining trust (audit trail, expiry). Phase 0 security must not be weakened by the shell.

---

## 15. Success

Measure outcomes, not page views. The analytics hook is a `console.debug` stub. Point it at a privacy-respecting product counter before judging the redesign. Suggested events, without sending precise coordinates:

| Signal | Why it matters |
| --- | --- |
| Sighting submitted, then approved | People contribute usable observations, and admins can keep up |
| Time from pending sighting to decision | The queue is workable |
| Report marked reunited | The outcome the map exists for. It will be incomplete. Treat it as a lower bound |
| Zone created and push enabled | Location alerts are wanted, not only built |
| Push sent for `lost_report_in_area` that is opened | Alerts are relevant enough to tap |
| Report hidden or flagged per 100 new reports | Trust work is proportionate |

Do not track walking paths. Do not add a social graph metric.

---

## 16. Explicitly out of scope

- Moderator role, roles table, in-app promotion of administrators
- Public profiles, follows, likes, comments, messages
- Points, badges, leaderboards
- Background location and stored movement history
- Anonymous Supabase users
- React Native or a second map library
- PostGIS, unless zone matching on the current data is actually slow
- Shelter, vet, or municipal sync
- Contact-detail field
- Pre-approval of every ordinary report
- Notifying owners about rejected sightings
- Offline maps

---

## 17. Decisions to confirm before build

1. **Vercel** is the host. **Confirmed.** Vercel deploys `jgilis/LostPetsWebsite` to the live site. The deployed app uses Supabase project `dmubikdkyusadzqngapy`.
2. **Area alerts fire only for new lost reports** in the first subscription release. Found reports are a later opt-in.
3. **Sightings stay usable without an account.** **Confirmed.** Withdrawal of a pending sighting is therefore impossible for those submissions. Logged-out submit was production-tested.
4. **Ordinary reports stay public immediately.** Only out-of-area pins, failed media, and flags interrupt that.
5. **Reunion events stay on Activity for 14 days**, then leave the list. The detail page can remain.
6. **No anonymous auth** in this version.
7. **Phase 1 marker tap.** Select and scroll/highlight the card, then open a detail sheet over Discover. Do not leave the map.
8. **Phase 1 Walking Mode.** Normal navigation stays visible. Prominent Exit Walking Mode control.
9. **Phase 1 legend.** Compact, must not obstruct map or report controls.
10. **Phase 1 visual direction.** Keep the existing styling. No redesign.

Phase 0, Phase 1, Phase 2, and Phase 3 slice 1 are complete in this repository. Remaining Phase 3 slices: `PRODUCT_PLAN.md` section 12. `/sightings/[id]` exact-location visibility is separate debt.

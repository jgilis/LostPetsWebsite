# Lost Pets Map — Product Plan

**Status:** Working product direction. Phase 0 is complete. Next work is Phase 1.  
**Scope:** Next version  
**Primary area:** Mechelen, Belgium  
**Languages:** English, Dutch and French

**Where to look**

| Need | Place |
|---|---|
| What to build next | This file, section 12 |
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
- Filter by animal species and report type.
- Browse the reports that fall inside the current map bounds, as cards synchronized with markers.
- Select a map marker or a report card: the matching card is highlighted, and details open in a sheet on top of Discover. The map is not left.
- Use Nearby (500 m) and Walking Mode on Discover.
- Start a report or sighting from the existing Help/report entry points until Phase 3.

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

### Help

The place to contribute.

There are three primary actions:

1. **I've lost a pet** — create a missing-animal report.
2. **I've found an animal** — create a found-animal report.
3. **I've seen a missing pet** — submit a sighting linked to an existing missing-animal report.

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

**Phase 1 visual direction:** keep the existing dark styling. Do not redesign colours, type, or chrome as part of Discover. A later warm/light exploration is not Phase 1.

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

| Phase | Focus | Status |
|---|---|---|
| 0 | Security, privacy and technical foundations | **Done.** Packages A, B and C are live. See section 15. |
| 1 | Discover navigation and map experience | **Next.** Not started. |
| 2 | Activity and map-area filtering | Not started |
| 3 | Help, reporting and editing flows | Not started |
| 4 | Area subscriptions and notifications | Not started |
| 5 | Administration, expiry and cleanup | Not started |

### What to build next — Phase 1 Discover shell

This is a new shell around the existing map, not a new map engine. Reuse `Map.tsx`, `useReports`, filters, Nearby and Walking Mode. Do not add tables, change production security, or start Phases 2–5.

Detail: `PRODUCT_STRATEGY.md` sections 5 (information architecture), 6 (Discover) and 14 (build order).

**Mobile**

- Full-screen map as the primary Discover screen. The map stays visible behind the sheet.
- A draggable bottom sheet of **report cards**, with three natural positions: collapsed, partially expanded, fully expanded.
- Moving the map updates the cards to the reports in the visible bounds.
- Selecting a card highlights its marker. Tapping a marker selects and scrolls/highlights the matching card, then opens a dedicated **detail sheet** over Discover. Do not navigate away from the map.
- Narrow-screen chrome: bottom bar for Discover / Activity / Help stays visible, including in Walking Mode. Account is a corner control, not a destination.

**Desktop**

- Map and a scrollable report list side by side.
- Moving the map updates the list to the visible bounds.
- Selecting a card and selecting a marker stay synchronized.
- Wide-screen chrome: slim top bar, no bottom bar.

**Keep**

- Existing species filters, lost/found filters, clusters, Mechelen bounds and map colours.
- Compact map legend (pin = lost, dot = found, colours = species), placed so it does not obstruct the map or report controls.
- Nearby as the existing 500 m feature on Discover. No text search.
- Walking Mode as a first-class Discover mode: foreground location only, reports prioritised by distance, **normal navigation remains visible**, and a clear prominent **Exit Walking Mode** control. Not part of Activity.
- Existing visual styling. No redesign in Phase 1.
- Map camera when switching destinations. Discover owns center, zoom and filters.
- Current Feed and Report screens behind Activity and Help until Phases 2 and 3.

**Do not**

- Show an Activity event feed (sightings, reunions) in the Discover list. That is Phase 2.
- Rebuild Help, photo/location edit, or 7-day reopen (Phase 3).
- Add database tables, area subscriptions, or admin audit work.
- Change Phase 0 security, RLS, captcha submit, sighting privacy, or production database state.
- Navigate away from Discover to `/report/[id]` on marker or card select.
- Redesign colours, type, or chrome.
- Fix `/sightings/[id]` exact-location visibility (separate debt).

**Out of this phase:** Activity scoped to map bounds and reunion events (2); Help as three tasks, photo/location edit, 7-day reopen (3); area subscriptions (4); moderation audit, expiry job, duplicate hints (5).

### Later phases

| Phase | Build |
|---|---|
| 2 | Activity lists events inside the Discover camera. Add approved sightings and 14-day reunions. Keep Mine. |
| 3 | Help as three tasks (lost, found, seen). Real edit of description, photo and pin. Reopen a resolved report within 7 days. |
| 4 | Area subscriptions and lost-report alerts on the existing notification/push pipeline. |
| 5 | Admin queue polish, `moderation_actions` audit trail, expiry job, duplicate hints. |

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
2. Confirm that area alerts initially cover new missing-animal reports only.
3. ~~Confirm that sightings remain possible without an account.~~ **Confirmed.** Logged-out submit was production-tested. The form still posts with no Authorization header.
4. Confirm that ordinary reports become public without administrator pre-approval.
5. Confirm the 14-day visibility period for reunions.
6. ~~Confirm the final visual direction.~~ **Phase 1: keep the existing styling.** A later redesign is out of this phase.
7. ~~Marker tap detail surface.~~ **Decided.** Select and scroll/highlight the matching card, then open a dedicated detail sheet over Discover. Do not navigate away from the map.
8. ~~Walking Mode chrome.~~ **Decided.** Keep Discover / Activity / Help visible. Provide a clear, prominent Exit Walking Mode control.
9. ~~Legend.~~ **Decided.** Keep a compact map legend if it does not obstruct the map or report controls.

### Outstanding technical debt (not Phase 1)

- `/sightings/[id]` can still show an exact location to whoever can load the row. Fix visibility (owner/admin only, or the same coarse public treatment as Discover) as a separate privacy task. Do not bundle it into Discover and do not change production for it in Phase 1.

## 15. Live baseline

**As of 9 November 2026.** Mechelen beta on Vercel from GitHub `jgilis/LostPetsWebsite`. Supabase project `dmubikdkyusadzqngapy`. Phase 0 is complete. The live home is still Map / Feed / Report tabs. Phase 1 Discover is specified in section 12 and is not built yet: bounds-synced report cards, detail sheet over the map, compact legend, Walking Mode with nav still visible. Existing styling. `/sightings/[id]` exact-location visibility is separate debt, not Phase 1.

### How production is updated

| Piece | How it is changed | Status |
|---|---|---|
| Next.js app | Push to GitHub; Vercel deploys automatically | Live |
| `smooth-processor` | `npx supabase functions deploy smooth-processor --project-ref dmubikdkyusadzqngapy --no-verify-jwt` | Deployed |
| `verify-captcha-v2` | `npx supabase functions deploy verify-captcha-v2 --project-ref dmubikdkyusadzqngapy` | Live; does not write `edit_token` |
| Database | SQL pasted in the production SQL Editor | Sighting/notification SQL, admin EXECUTE grant, Packages A–C SQL (owner SELECT and `edit_token` drop included). Do not run `supabase db push` |
| Other Edge Functions | CLI deploy when explicitly done | Unused `verify-captcha` was redeployed with Package C. `flag-report` was not redeployed in this round |

There is no verified automatic Supabase–GitHub integration. Production does not have a trustworthy `schema_migrations` history for the full schema. The database cannot be rebuilt from this repository.

### What is live — preserve

- Lost and found reports; sightings linked to lost reports. Ordinary reports are public without pre-approval.
- Public browse without an account. Sightings can be submitted while logged out; they stay pending until an administrator approves them.
- Signed-in owners can edit name and description, mark reunited, permanently delete, and read their own hidden rows. They cannot reopen. Admin hide (`removed`) is not the same as delete.
- Exact sighting coordinates are not public. Owners and admins use `sighting_exact_coordinates`. Approval writes the owner notification on the server. Web Push on approval is verified.
- Report pins are offset server-side. Report photos are re-encoded, EXIF-stripped, and stored at public URLs. Hard delete removes the storage object; soft-remove keeps it.
- `edit_token` is gone. `/edit` uses `?id=` and `owner_user_id`.
- Leaflet map, clusters, species colours, Mechelen bounds, Nearby, Walking Mode, PWA, en/nl/fr, admin out-of-area highlighting.

### Implementation rule

Do not recreate existing functionality simply because it appears in a product requirement.

First inspect the current implementation, identify what can be preserved, and make the smallest safe change that achieves the desired behavior.

# Lost Pets Map — Product Plan

**Status:** Working product direction  
**Scope:** Next version  
**Primary area:** Mechelen, Belgium  
**Languages:** English, Dutch and French

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

The map-first experience.

Users can:
- Explore missing and found animals.
- Filter by animal species and report type.
- Select a map marker to see report details.
- Browse nearby reports.
- Use Walking Mode to explore nearby information while moving.
- Start a report or sighting.

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

Nearby remains based on a 500-metre radius around the relevant location. Walking Mode uses foreground GPS only.

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

**Visual direction still to confirm:** the intended redesign should explore a warm, light interface with muted greens and charcoal rather than automatically preserving the current dark styling.

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

The current hosting assumption is Vercel; verify it before relying on it.

## 12. Development priorities

Work in small, reviewable phases.

| Phase | Focus |
|---|---|
| 0 | Security, privacy and technical foundations |
| 1 | Discover navigation and map experience |
| 2 | Activity and map-area filtering |
| 3 | Help, reporting and editing flows |
| 4 | Area subscriptions and notifications |
| 5 | Administration, expiry and cleanup |

Phase 0 is particularly important. Before redesigning the interface, verify database permissions, sighting privacy, report ownership, photo handling and server-side abuse protection.

Each phase should be completed and tested before moving on.

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

1. Confirm Vercel as the hosting platform.
2. Confirm that area alerts initially cover new missing-animal reports only.
3. Confirm that sightings remain possible without an account.
4. Confirm that ordinary reports become public without administrator pre-approval.
5. Confirm the 14-day visibility period for reunions.
6. Confirm the final visual direction.

## 15. Current implementation baseline

The existing Mechelen beta on `main` at commit `cdc62cf` is the starting point for this project.

The next version is an evolution of the existing application, not a rebuild.

### Already implemented — preserve

- Separate lost and found reports, and sightings linked to lost reports.
- Public browsing without account registration.
- Signed-in report creation and ownership.
- Ordinary reports published without administrator pre-approval.
- Sighting approval and rejection workflows.
- Existing visitor, signed-in user and administrator roles.
- Leaflet map, markers, clusters, species colours and Mechelen bounds.
- Nearby list and foreground-only Walking Mode.
- Report statuses and 120-day expiry timestamps.
- Owner notifications and existing Web Push functionality.
- Installable PWA and English, Dutch and French support.
- Administrator visibility of out-of-area reports.

### Partially implemented — improve

- Main navigation and map persistence.
- Activity feed and local filtering.
- Sighting submission and moderation interface.
- Report editing and reopening.
- Report and photo deletion.
- Expiry processing.
- Flagging interface.
- Magic-link draft preservation.
- Translations across all screens.
- Consistent interface components and styling.

### Not implemented — build

- Discover / Activity / Help navigation.
- Map camera shared across sections.
- Activity events for approved sightings.
- Fourteen-day reunion visibility.
- Full report editing and seven-day reopening.
- Area subscriptions and missing-animal alerts.
- Moderation audit trail.
- Server-enforced location privacy.
- Duplicate hints.
- Reliable storage cleanup.

### Critical verification items

Before building the new navigation, verify:

- Supabase RLS policies for reports, sightings, profiles and administrator actions.
- Server-side enforcement of report location offsets.
- Public access restrictions for exact sighting coordinates.
- Explicit approved-status filtering in public sighting queries.
- The actual behavior and source code of `smooth-processor` and `flag-report`.
- Server-side photo validation, privacy and deletion.
- Actual hosting provider; Vercel is not yet verified.

### Implementation rule

Do not recreate existing functionality simply because it appears in a product requirement.

First inspect the current implementation, identify what can be preserved, and make the smallest safe change that achieves the desired behavior.

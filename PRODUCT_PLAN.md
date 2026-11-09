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

The live website is hosted on **Vercel**. Vercel deploys automatically from the GitHub repository. That hosting fact is confirmed by a successful production deployment of the Phase 0 frontend.

## 12. Development priorities

Work in small, reviewable phases. Do not start Phase 1 until remaining Phase 0 work is done.

| Phase | Focus | Status |
|---|---|---|
| 0 | Security, privacy and technical foundations | In progress. Sighting and notification security is in production and verified. Other trust items remain. |
| 1 | Discover navigation and map experience | Not started |
| 2 | Activity and map-area filtering | Not started |
| 3 | Help, reporting and editing flows | Not started |
| 4 | Area subscriptions and notifications | Not started |
| 5 | Administration, expiry and cleanup | Not started |

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

1. ~~Confirm Vercel as the hosting platform.~~ **Confirmed.** Vercel deploys the GitHub repository. The live site was checked after the Phase 0 frontend went Ready.
2. Confirm that area alerts initially cover new missing-animal reports only.
3. Confirm that sightings remain possible without an account. The form still posts with no Authorization header. Logged-out submission was not independently recorded in the latest production tests.
4. Confirm that ordinary reports become public without administrator pre-approval.
5. Confirm the 14-day visibility period for reunions.
6. Confirm the final visual direction.

## 15. Current implementation baseline

**As of 9 November 2026.** The live product is the Mechelen beta. Application code is on GitHub at `jgilis/LostPetsWebsite`, currently `main` commit `cd8eedd` (`security updates`). Vercel deploys that repository. The next version remains an evolution of this application, not a rebuild.

### How production is updated

| Piece | How it is changed | Status |
|---|---|---|
| Next.js app | Push to GitHub; Vercel deploys automatically | Phase 0 frontend is live |
| `smooth-processor` | `npx supabase functions deploy smooth-processor --project-ref dmubikdkyusadzqngapy --no-verify-jwt` | Deployed |
| Database | SQL pasted in the production SQL Editor | `20261107180000_sighting_and_notification_security.sql` applied, then the `is_current_user_admin` EXECUTE grant |
| Other Edge Functions | CLI deploy when explicitly done | `verify-captcha`, `flag-report`, and `send-push-on-notification` were not redeployed in this round |

There is no verified automatic Supabase–GitHub integration. Production does not have a trustworthy `schema_migrations` history for the full schema. The database cannot be rebuilt from this repository. Do not run `supabase db push`.

The EXECUTE grant that fixed admin approval is live in production. The follow-up file `supabase/migrations/20261109114100_grant_is_current_user_admin_execute.sql` exists locally and may not yet be on GitHub.

### Production-tested sighting workflow

Tested on 9 November 2026 from `http://localhost:3000` against production Supabase, after the SQL and the EXECUTE grant:

- A sighting was submitted and appeared in `/admin/sightings` as Pending.
- Pending sightings were not publicly visible.
- An administrator approved the sighting after the permission fix.
- The lost-report owner received the in-app sighting notification and can see the sighting.
- An administrator can see the sighting details.
- Other users see only “This animal has recently been sighted nearby.” They do not see exact sighting details or location.

That path is **production-tested**. It does **not** by itself prove logged-out anonymous submission or Web Push delivery.

### Already implemented — preserve

- Separate lost and found reports, and sightings linked to lost reports.
- Public browsing without account registration.
- Signed-in report creation and ownership.
- Ordinary reports published without administrator pre-approval.
- Sighting approval and rejection, now enforced in the database for sighting status.
- Existing visitor, signed-in user and administrator roles.
- Leaflet map, markers, clusters, species colours and Mechelen bounds.
- Nearby list and foreground-only Walking Mode.
- Report statuses and 120-day expiry timestamps.
- Owner in-app notifications when a sighting is approved; Web Push pipeline still exists.
- Installable PWA and English, Dutch and French support.
- Administrator visibility of out-of-area reports in the admin UI.

### Phase 0 reassessment

Compared with the current application, the applied production SQL, and the last live policy audit of `reports` (the sighting migration did not change report or storage policies).

| Item | Status |
|---|---|
| Unrestricted client sighting inserts | **Completed and verified.** Open insert policy dropped. New rows are forced to `pending`. |
| Public exact sighting coordinates | **Completed and verified.** Table `SELECT` on coordinates revoked; public queries omit them; other users see the coarse message. |
| Owner and admin exact coordinates | **Completed and verified.** `sighting_exact_coordinates` plus the tested owner/admin UI. |
| Approved-only public sighting queries | **Completed and verified.** |
| Admin-only sighting approve/reject | **Completed and verified** after granting `EXECUTE` on `is_current_user_admin()` to `authenticated`. The helper remains `SECURITY INVOKER`. |
| Server-side owner notification on approval | **Completed and verified** as an in-app notification. |
| Remove client `notification_events` inserts | **Implemented.** Production SQL revoked the open insert. Direct-insert attacks were not re-tested. |
| `smooth-processor` source and deploy | **Completed and verified.** Source is `supabase/functions/smooth-processor/index.ts`. Deployed with `--no-verify-jwt`. |
| Hosting | **Completed and verified.** Vercel, from GitHub. |
| Report owner UPDATE/DELETE RLS | **Implemented but not yet verified.** Live audit: owners may update and delete their own reports. Not re-tested in this round. |
| Direct authenticated `reports` INSERT | **Requires investigation / still open.** Live audit allowed insert when `owner_user_id = auth.uid()`, which bypasses captcha. Not changed by the sighting SQL. |
| Admin access to reports | **Not implemented** in RLS. Admin pages still use the user JWT. There is no admin policy on `reports`, so flagged, removed and expired rows are not readable that way. |
| Admin access to flags | **Not implemented** in RLS. `reports_flags` has insert only; no SELECT for administrators. `/admin/flags` cannot be trusted until that changes. |
| Server-side report location offset | **Not implemented.** `applyLocationOffset` still runs in the browser. `verify-captcha` stores the coordinates it is given. |
| Photo type, size, EXIF, cleanup | **Partially implemented.** Bucket allows `image/*` up to 5 MB. The form uses `accept="image/*"`. No EXIF stripping. Report delete does not delete the storage object. Storage RLS remains loose. |
| Required report type and species | **Partially implemented.** The form defaults to empty placeholders. There is no `required` check and `verify-captcha` does not validate the values. |
| Stop writing `edit_token` | **Not implemented.** `verify-captcha` still writes `edit_token` and returns `/edit?token=`. The edit page uses `?id=` and `owner_user_id`. |
| Call `onReportCreated` | **Not implemented.** Home passes the callback; `ReportForm` never calls it. |
| Privacy policy accuracy | **Partially implemented.** Public sighting copy is closer to reality. The page still claims hashed IPs for report submit (`verify-captcha` does not hash IP) and optional public contact details (the form sends an empty string). |
| `flag-report` in the repository | **Implemented but not yet verified.** Source is in `supabase/functions/flag-report/`. This round did not redeploy it. |
| Anonymous sighting submit | **Implemented but not yet verified.** The form still posts without an Authorization header. The recorded tests do not state that the tester was signed out. |
| Web Push on sighting approval | **Implemented but not yet verified.** The webhook and `send-push-on-notification` remain. The recorded tests confirmed the in-app notification only. |

### Remaining Phase 0 work before Phase 1

- Admin RLS (or a trusted server path) for reports and flags.
- Move report location offset into `verify-captcha`.
- Tighten photo upload, strip EXIF, delete objects when a report is deleted.
- Validate type and species on the server.
- Stop writing `edit_token`.
- Invoke `onReportCreated` after a successful report.
- Align privacy copy with what is actually stored.
- Decide whether authenticated clients may insert `reports` directly.
- Independently verify logged-out sighting submit and Web Push if those remain product promises.

### Later product work (unchanged)

- Main navigation and map persistence.
- Discover / Activity / Help.
- Activity events for approved sightings and 14-day reunions.
- Full report editing and seven-day reopening.
- Area subscriptions.
- Moderation audit trail, expiry job, duplicate hints.

### Implementation rule

Do not recreate existing functionality simply because it appears in a product requirement.

First inspect the current implementation, identify what can be preserved, and make the smallest safe change that achieves the desired behavior.

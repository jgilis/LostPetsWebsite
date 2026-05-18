# Lost Pets Map — Mechelen (beta)

Community map for **lost** and **found** pet reports in the Mechelen area. This repo is the Next.js frontend; data lives in **Supabase** (Postgres + Auth + Realtime + Edge Functions).

**Audience:** beta testers and contributors — not polished end-user docs yet.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Leaflet** / **react-leaflet** · **supercluster** (map clustering)
- **Supabase** client (auth, queries, realtime)
- **hCaptcha** on report submission (via `verify-captcha` edge function)
- Optional **PWA** + **web push** (VAPID; edge function `send-push-on-notification`)

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in values (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production check
npm run lint
```

### Environment (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | hCaptcha site key (report form) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional — web push in footer |

Push delivery also needs Supabase secrets + DB webhook; see comments in `.env.example`.

## What to exercise

| Area | Notes |
|------|--------|
| **Map** | Centered on Mechelen; zoom 10–16, bounded viewport. Lost = pin markers; found = colored dots (+ soft halos at zoom ≥ 13.5). Filters: animal type + lost/found. |
| **Reports** | Login required (magic link). Create lost/found with map pick + optional photo. Locations stored with a small privacy offset. |
| **Sightings** | From a report popup — GPS (“Use my location”) or pick on map. Pending until admin approval. |
| **Notifications** | In-app list for report owners when a sighting is approved; realtime via `notification_events`. |
| **Admin** | `/admin` — requires `profiles.is_admin`. Reports (resolve/remove), flagged queue, sightings moderation. Out-of-area coords highlighted. |
| **PWA** | Install prompt + push opt-in in footer (production build / HTTPS). |

## Routes (quick reference)

| Path | Role |
|------|------|
| `/` | Map + report tabs |
| `/login` | Magic-link sign-in |
| `/notifications` | Owner notifications (auth) |
| `/edit` | Edit own report |
| `/about` | Beta tester overview |
| `/privacy` · `/terms` | Legal copy |
| `/admin` · `/admin/reports` · `/admin/flags` · `/admin/sightings` | Moderation |

## Repo layout

```
app/                 # App Router pages
src/components/      # UI (map, report form, admin, sightings, auth, PWA)
src/lib/             # Supabase helpers, reports, sightings, bounds, push
src/hooks/           # useAdmin, useReports, realtime resilience, etc.
supabase/
  functions/         # verify-captcha, send-push-on-notification
  migrations/        # SQL migrations (apply in Supabase dashboard/CLI)
public/              # PWA manifest, service worker, Leaflet assets
docs/                # Internal notes (e.g. RLS audit)
```

## Feedback we care about

- Broken flows (auth hash after magic link, map clicks, popup layout on mobile)
- Realtime gaps (report/sighting/notification not updating until refresh)
- Moderation edge cases (out-of-area coords, flagged reports, sighting approval)
- Security / privacy surprises (what’s public vs owner-only)
- Console errors and failed network calls (Supabase RLS, edge functions, captcha)

Please include **browser**, **steps**, and **screenshots** when possible. Not affiliated with official animal rescue services — community MVP.

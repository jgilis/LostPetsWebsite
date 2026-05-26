# Native-readiness audit

Concise audit of browser/platform coupling relevant to proximity, Walking Mode, geocoding, and realtime recovery. **No native implementation in scope.**

## Awareness & Walking Mode

| API | Location | Abstracted? | Native replacement |
|-----|----------|-------------|-------------------|
| `navigator.geolocation` | `src/lib/platform/browserGeolocation.ts` (via `useWalkingMode`) | **Yes** — single module | **Moderate** — swap module with Capacitor `@capacitor/geolocation` or native bridge; keep hook contract |
| `document.visibilitychange` | `src/lib/platform/browserDocument.ts` (via `useWalkingMode`) | **Yes** | **Easy** — map to `App` state / `appStateChange` |
| `window.setInterval` | `useWalkingMode` (freshness tick) | No (generic timer) | **Easy** — same in native |
| `window.requestAnimationFrame` | `NearbyAwareness` (refresh UX) | No | **Easy** — optional `setTimeout(0)` on native |

**Boundary:** `NearbyAwareness` has **no** geolocation imports. Center comes from props + `useWalkingMode` hook only.

## Proximity center providers

| File | Wired? | Role |
|------|--------|------|
| `ProximityCenterProvider.ts` | Type contract | Frozen `getCenter()` interface |
| `mapCenterProvider.ts` | **No** | Reference adapter for map-derived center |
| `userLocationProvider.ts` | **No** | Reference adapter for injectable user location |

`NearbyAwareness` inlines center selection today. Native path: inject `readUserLocation` via `UserLocationProvider` without changing geo math.

## Reverse geocoding

| API | Location | Abstracted? | Native replacement |
|-----|----------|-------------|-------------------|
| `fetch` (Nominatim) | `reverseGeocode.ts` | Network only | **Easy** — same HTTP or server proxy |
| `localStorage` | `reverseGeocode.ts` (`readStorage` / `writeStorage`) | Local helpers | **Moderate** — `@capacitor/preferences` or SQLite |
| In-memory cache | `geocodeCache.ts` | Pure Map | **Easy** — unchanged |

Not on proximity critical path; labels only.

## Realtime recovery

| API | Location | Abstracted? | Native replacement |
|-----|----------|-------------|-------------------|
| `document.visibilitychange` | `useResilientRealtimeChannel.ts` | No | **Easy** — app foreground event |
| Supabase channel | same hook | SDK-level | **Easy** — same client |

Independent from proximity math; affects report list freshness on map.

## Push / notifications (existing, out of proximity scope)

| API | Location | Native replacement |
|-----|----------|-------------------|
| `Notification`, `serviceWorker`, `PushManager` | `pushNotifications.ts` | **Hard** — separate native push stack (FCM/APNs) |
| In-app notifications | `NotificationsProvider` + Supabase | **Easy** — already server-driven |

**Do not conflate** with proximity alerts (see `proximity-architecture.md`).

## Other geolocation (non-walking)

| Location | Purpose | Native note |
|----------|---------|-------------|
| `SightingsModal.tsx` | One-shot position for sighting | Separate from Walking Mode; same `browserGeolocation` candidate later |

## Recommended abstraction boundaries (frozen)

1. **`browserGeolocation.ts`** — all foreground GPS for Walking Mode
2. **`useWalkingMode.ts`** — session, staleness, recovery; platform-agnostic outputs (`GeoPoint`, `hasActiveUserLocation`)
3. **`src/lib/geo/*`** — pure spatial layer (no DOM/navigator)
4. **`ProximityCenterProvider`** — center source injection (map vs user)
5. **`NearbyAwareness.tsx`** — UI orchestration only
6. **`proximityMemory` / `proximityAttention`** — session semantics (no I/O)

## Future proximity alerts (documentation only)

**Already supports well:** `ProximityEvent` list, distance, attention flags, session seen-memory, stable refresh.

**Would need later (not implemented):** persisted alert subscriptions, background location (explicitly out of scope), server-side geofence or push payload, user opt-in, dedupe across sessions.

**Foreground-only today:** Walking Mode, nearby recompute, NEW/SEEN labels, refresh — must remain foreground until product explicitly expands.

# Proximity architecture (frozen)

Intentional freeze after Days 4–13. **Do not change** without explicit product/architecture review.

## Layer 1 — Proximity math (pure)

- `haversine.ts`, `isWithinRadius.ts`, `getNearbyReports.ts`
- Input: reports + center `GeoPoint` + radius (default **500 m**)
- Output: `ProximityEvent[]` sorted by distance, tie-break `report.id`
- **No** React, browser APIs, or Supabase

## Layer 2 — Awareness center

- **Map mode:** stabilized map bounds midpoint (`stabilizeProximityCenter`, 4 decimals)
- **Walking mode:** user location only when `hasActiveUserLocation` (fresh ≤60s)
- **Waiting:** walking on but no fresh GPS → no list, no map fallback
- `ProximityCenterProvider` + `mapCenterProvider` / `userLocationProvider` are frozen reference adapters; UI currently inlines equivalent logic in `NearbyAwareness`

## Layer 3 — Walking Mode

- `useWalkingMode` — foreground-only GPS via `browserGeolocation`
- Session guards, stale clearing, visibility recovery via `browserDocument`
- Errors on initial fix → stop walking; watch errors → clear location, stay in walking mode waiting

## Layer 4 — Attention semantics (session)

| Label | Rule |
|-------|------|
| **Very close** | distance &lt; 75 m |
| **New nearby** | report id not in `proximityMemory` |
| **Seen** | id in memory after first row display |
| Precedence | very close → new → seen |

- `markSeen` on row mount (`useLayoutEffect`); memory survives pan/refresh/toggle
- **Not** persisted across page reload
- Refresh does **not** clear memory

## Layer 5 — UI (`NearbyAwareness`)

- Single status line (one truth): updating → waiting → using location → map view
- List hidden while refreshing or waiting for GPS
- Empty only when center ready and `nearby.length === 0`
- Refresh = `refreshToken` bump (recheck), not new session

## Layer 6 — Presentation

- `ProximityEventRow` — dominant label, memo by rounded meters + id
- `formatProximityDistance` — display only

## Stable contracts (do not break)

1. Haversine + 500 m radius
2. Attention thresholds and precedence
3. Session-only seen memory semantics
4. Walking = foreground GPS; no background tracking
5. Refresh ≠ reset session memory
6. Map focus via `/?focus=` (separate subsystem)

## Future native evolution

Replace `browserGeolocation` + optionally wire `UserLocationProvider` with native location reader. **Do not** move attention rules or radius into native without web parity.

## Future alerts (not implemented)

Proximity system produces **read-only** ranked events suitable for future foreground alerts. Background geofencing and push require new product layer; see `native-readiness-audit.md`.

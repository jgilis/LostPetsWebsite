import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const client = readFileSync("app/sightings/[id]/SightingClient.tsx", "utf8");
const page = readFileSync("app/sightings/[id]/page.tsx", "utf8");
const sightings = readFileSync("src/lib/sightings.ts", "utf8");
const permissions = readFileSync("src/lib/permissions.ts", "utf8");
const map = readFileSync("src/components/sightings/SightingMap.tsx", "utf8");

test("sighting detail exact pin is owner or admin only", () => {
  assert.match(permissions, /export function canSeeExactSightings/);
  assert.match(client, /canSeeExactSightings\(/);
  assert.match(client, /owner_user_id/);
  assert.match(client, /if \(!canSeeExact\)/);
  assert.match(client, /activitySightingNearby/);
  assert.match(client, /LocationDisplay/);
  assert.match(client, /activityEventFocusHref/);
  assert.match(client, /canSeeExact \? \(/);
  assert.match(client, /withExactCoordinates/);
  assert.match(client, /latitude=\{reportDetails\.latitude\}/);
});

test("public sighting fetch does not select exact coordinates", () => {
  assert.match(page, /getPublicSightingById/);
  assert.match(sightings, /PUBLIC_SIGHTING_COLUMNS/);
  assert.doesNotMatch(
    sightings.split("export const PUBLIC_SIGHTING_COLUMNS")[1].split(";")[0],
    /latitude/,
  );
  assert.match(client, /withoutExactPoint/);
  assert.match(map, /hasExactSighting/);
});

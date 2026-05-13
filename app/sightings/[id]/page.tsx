import SightingClient from "./SightingClient";

import { getAdminSightingById } from "../../../src/lib/sightings";
import {
  isOwner,
  canViewSighting,
} from "../../../src/lib/permissions";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const sighting = await getAdminSightingById(params.id);

    return (
    <pre>
      {JSON.stringify(sighting, null, 2)}
    </pre>
  );

  if (!sighting) {
    return <p>Sighting not found</p>;
  }

  const report = Array.isArray(sighting.reports)
    ? sighting.reports[0]
    : sighting.reports;

  // TEMP (you will replace later with real auth)
  const ownerToken = null;
  const isAdmin = true;

  const owner = isOwner(
    ownerToken,
    report?.owner_user_id ?? null
  );

  const allowed = canViewSighting({
    sightingStatus: sighting.status,
    isAdmin,
    isOwner: owner,
  });

  if (!allowed) {
    return <p>Unauthorized</p>;
  }

  return <SightingClient sighting={sighting} />;
}
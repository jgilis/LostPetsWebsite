import SightingClient from "./SightingClient";

import { getAdminSightingById } from "../../../src/lib/sightings";
import {
  isOwner,
  canViewSighting,
} from "../../../src/lib/permissions";
import { cookies } from "next/headers";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const sighting = await getAdminSightingById(params.id);

  if (!sighting) {
    return <p>Sighting not found</p>;
  }

  const report = Array.isArray(sighting.reports)
    ? sighting.reports[0]
    : sighting.reports;

  // TEMP (you will replace later with real auth)
  // owner token from browser cookie
  const cookieStore = await cookies();
  const ownerToken =
    cookieStore.get("ownerToken")?.value ?? null;
  const isAdmin = false;
  //
  
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
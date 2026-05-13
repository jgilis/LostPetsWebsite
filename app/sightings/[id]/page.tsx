import SightingClient from "./SightingClient";

import { getAdminSightingById } from "../../../src/lib/sightings";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const sighting = await getAdminSightingById(params.id);

  if (!sighting) {
    return <p>Sighting not found</p>;
  }

  return <SightingClient sighting={sighting} />;
}
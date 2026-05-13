import SightingClient from "./SightingClient";

import { getPublicSightingById } from "../../../src/lib/sightings";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const sighting = await getPublicSightingById(params.id);

  if (!sighting) {
    return <p>Sighting not found</p>;
  }

  return <SightingClient sighting={sighting} />;
}
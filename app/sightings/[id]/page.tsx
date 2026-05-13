import SightingClient from "./SightingClient";
import { getPublicSightingById } from "../../../src/lib/sightings";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  console.log("PAGE EXECUTING"); // 👈 ADD HERE
  const { id } = await params;

  const sighting = await getPublicSightingById(id);

  if (!sighting) {
    return <p>Sighting not found</p>;
  }

  return <SightingClient sighting={sighting} />;
}
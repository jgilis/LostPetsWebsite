import SightingClient from "./SightingClient";
import { getPublicSightingById } from "../../../src/lib/sightings";

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const sighting = await getPublicSightingById(params.id);

  // DEBUG: replace silent failure with visible state
  if (!sighting) {
    return (
      <div style={{ padding: 20 }}>
        <h2>❌ Sighting not found</h2>
        <p><strong>ID:</strong> {params.id}</p>
        <p>
          This means <code>getPublicSightingById()</code> returned null.
        </p>
        <p>
          Most likely causes:
        </p>
        <ul>
          <li>RLS blocking SELECT on sightings</li>
          <li>Wrong table/view used inside getPublicSightingById</li>
          <li>Status filter removing the row</li>
        </ul>
      </div>
    );
  }

  return <SightingClient sighting={sighting} />;
}
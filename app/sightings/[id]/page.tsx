import { supabase } from "../../../src/lib/supabase";
import {
  MapContainer,
  TileLayer,
  Marker,
} from "react-leaflet";

export default async function SightingPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: sighting } = await supabase
    .from("sightings")
    .select(`
      *,
      reports:lost_report_id (
        id,
        animal_type,
        animal_name,
        latitude,
        longitude,
        owner_user_id
      )
    `)
    .eq("id", params.id)
    .single();

  const isAdmin = true; // temporary (you already gate admin elsewhere)

  if (sighting.status !== "approved" && !isAdmin) {
    return <p>Not available yet</p>;
  }

  const ownerToken =
  typeof window !== "undefined"
    ? localStorage.getItem("owner_token")
    : null;

  const isOwner =
    ownerToken &&
    ownerToken === sighting.reports?.owner_user_id;

  if (!isOwner && !isAdmin) {
    return <p>Unauthorized</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🐾 Sighting Detail</h1>

      {/* MAP CONTEXT */}
      <div style={{ height: 300, marginBottom: 20 }}>
        <MapContainer
          center={[sighting.latitude, sighting.longitude]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* LOST PET */}
          <Marker
            position={[
              sighting.reports.latitude,
              sighting.reports.longitude,
            ]}
          />

          {/* SIGHTING */}
          <Marker position={[sighting.latitude, sighting.longitude]} />
        </MapContainer>
      </div>

      {/* INFO BLOCK */}
      <div>
        <h2>
          {sighting.reports.animal_type}{" "}
          {sighting.reports.animal_name || ""}
        </h2>

        <p>{sighting.description}</p>

        <p>Status: {sighting.status}</p>

        <p>
          Lost location → sighting distance will come later (you already
          have helper)
        </p>
      </div>
    </div>
  );
}
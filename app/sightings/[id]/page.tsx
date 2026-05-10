"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";

import {
  MapContainer,
  TileLayer,
  Marker,
} from "react-leaflet";

type Sighting = {
  id: string;
  latitude: number;
  longitude: number;
  description: string | null;
  status: string;

  reports: {
    id: string;
    animal_type: string;
    animal_name: string | null;
    latitude: number;
    longitude: number;
    owner_user_id: string | null;
  };
};

export default function SightingPage() {
  const params = useParams();
  const id = params.id as string;

  const [sighting, setSighting] =
    useState<Sighting | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
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
        .eq("id", id)
        .single();

      setSighting(data as Sighting);
      setLoading(false);
    }

    if (id) {
      load();
    }
  }, [id]);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  if (!sighting) {
    return <p style={{ padding: 20 }}>Sighting not found</p>;
  }

  const isAdmin = true; // temporary

  const ownerToken =
    typeof window !== "undefined"
      ? localStorage.getItem("owner_token")
      : null;

  const isOwner =
    ownerToken &&
    ownerToken === sighting.reports?.owner_user_id;

  if (
    sighting.status !== "approved" &&
    !isAdmin
  ) {
    return <p style={{ padding: 20 }}>Not available yet</p>;
  }

  if (!isOwner && !isAdmin) {
    return <p style={{ padding: 20 }}>Unauthorized</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🐾 Sighting Detail</h1>

      {/* MAP */}
      <div
        style={{
          height: 300,
          marginBottom: 20,
        }}
      >
        <MapContainer
          center={[
            sighting.latitude,
            sighting.longitude,
          ]}
          zoom={14}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* LOST LOCATION */}
          <Marker
            position={[
              sighting.reports.latitude,
              sighting.reports.longitude,
            ]}
          />

          {/* SIGHTING */}
          <Marker
            position={[
              sighting.latitude,
              sighting.longitude,
            ]}
          />
        </MapContainer>
      </div>

      {/* DETAILS */}
      <div>
        <h2>
          {sighting.reports.animal_type}{" "}
          {sighting.reports.animal_name || ""}
        </h2>

        <p>
          {sighting.description ||
            "No description"}
        </p>

        <p>Status: {sighting.status}</p>
      </div>
    </div>
  );
}
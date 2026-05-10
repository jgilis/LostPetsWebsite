"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";
import dynamic from "next/dynamic";

const SightingMap = dynamic(
  () => import("./SightingMap"),
  {
    ssr: false,
  }
);

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

type Props = {
  id: string;
};

export default function SightingClient({
  id,
}: Props) {

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
      <SightingMap sighting={sighting} />

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
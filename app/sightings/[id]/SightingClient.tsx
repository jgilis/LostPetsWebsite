"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";
import dynamic from "next/dynamic";

const SightingMap = dynamic(
  () => import("./SightingMap"),
  { ssr: false }
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

export default function SightingClient({ id }: Props) {
  console.log("SightingClient rendered with id:", id);
  const [sighting, setSighting] = useState<Sighting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      console.log("LOADING sighting id:", id);

      const res = await supabase
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

      console.log("SUPABASE RESPONSE:", res);

      if (res.error) {
        console.error("SUPABASE ERROR:", res.error);
      }

      setSighting(res.data as Sighting);
      setLoading(false);
    }

    if (id) load();
  }, [id]);

  // ----------------------------
  // LOADING STATE
  // ----------------------------
  if (loading) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  // ----------------------------
  // NOT FOUND STATE
  // ----------------------------
  if (!sighting) {
    return <p style={{ padding: 20 }}>Sighting not found</p>;
  }

  // ----------------------------
  // SAFE VARIABLE (TYPE NARROWING)
  // ----------------------------
  const safeSighting = sighting;

  // ----------------------------
  // AUTH LOGIC
  // ----------------------------
  const isAdmin = true; // temporary

  const ownerToken =
    typeof window !== "undefined"
      ? localStorage.getItem("owner_token")
      : null;

  const isOwner =
    !!ownerToken &&
    ownerToken === safeSighting.reports?.owner_user_id;

  if (safeSighting.status !== "approved" && !isAdmin) {
    return <p style={{ padding: 20 }}>Not available yet</p>;
  }

  if (!isOwner && !isAdmin) {
    return <p style={{ padding: 20 }}>Unauthorized</p>;
  }

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div style={{ padding: 20 }}>
      <h1>🐾 Sighting Detail</h1>

      {/* MAP */}
      <SightingMap sighting={safeSighting} />

      {/* DETAILS */}
      <div>
        <h2>
          {safeSighting.reports.animal_type}{" "}
          {safeSighting.reports.animal_name || ""}
        </h2>

        <p>
          {safeSighting.description || "No description"}
        </p>

        <p>Status: {safeSighting.status}</p>
      </div>
    </div>
  );
}
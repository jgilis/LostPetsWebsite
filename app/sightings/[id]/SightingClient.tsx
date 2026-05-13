"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getPublicSightingById } from "../../../src/lib/sightings";

const SightingMap = dynamic(() => import("./SightingMap"), {
  ssr: false,
});

type Sighting = {
  id: string;
  latitude: number;
  longitude: number;
  description: string | null;
  status: string;

  report: {
    id: string;
    animal_type: string;
    animal_name: string | null;
    latitude: number;
    longitude: number;
    owner_user_id: string | null;
  } | null;
};

type Props = {
  id: string;
};

export default function SightingClient({ id }: Props) {
  const [sighting, setSighting] = useState<Sighting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getPublicSightingById(id);

        console.log("PUBLIC SIGHTING:", data);

        if (!cancelled) {
          setSighting(data as Sighting);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setSighting(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  if (!sighting) {
    return <p style={{ padding: 20 }}>Sighting not found</p>;
  }

  const report = sighting.report;

  const isAdmin = true;

  const ownerToken =
    typeof window !== "undefined"
      ? localStorage.getItem("owner_token")
      : null;

  const isOwner =
    !!ownerToken && report?.owner_user_id === ownerToken;

  if (sighting.status !== "approved" && !isAdmin) {
    return <p style={{ padding: 20 }}>Not available yet</p>;
  }

  if (!isOwner && !isAdmin) {
    return <p style={{ padding: 20 }}>Unauthorized</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "700",
          marginBottom: "24px",
        }}
      >
        🐾 Sighting Detail
      </h1>

      <SightingMap sighting={sighting} report={report} />
      
      <div>
        <h2>
          {report?.animal_type ?? "Unknown"}{" "}
          {report?.animal_name ?? ""}
        </h2>

        <p>{sighting.description || "No description"}</p>

        <p>Status: {sighting.status}</p>
      </div>
    </div>
  );
}
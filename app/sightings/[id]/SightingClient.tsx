"use client";

import dynamic from "next/dynamic";

const SightingMap = dynamic(() => import("../../../src/components/sightings/SightingMap"), {
  ssr: false,
});

export default function SightingClient({ sighting }: any) {
  const report = sighting.reports;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: 24 }}>
        🐾 Sighting Detail
      </h1>
      <SightingMap
        sighting={sighting}
        report={report}
      />
      <div>
        <h2>
          {report?.animal_type} {report?.animal_name || ""}
        </h2>

        <p>{sighting.description || "No description"}</p>

        <p>Status: {sighting.status}</p>
      </div>
    </div>
  );
}
"use client";

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";

type Props = {
  sighting: {
    latitude: number;
    longitude: number;
  };
  report: {
    latitude: number;
    longitude: number;
  } | null;
};

export default function SightingMap({ sighting, report }: Props) {
  return (
    <div
      style={{
        height: 300,
        marginBottom: 20,
      }}
    >
      <MapContainer
        center={[sighting.latitude, sighting.longitude]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* LOST LOCATION */}
        {report && (
          <CircleMarker
            center={[report.latitude, report.longitude]}
            radius={10}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#2563eb",
              fillOpacity: 0.9,
              weight: 2,
            }}
          />
        )}

        {/* SIGHTING LOCATION */}
        <CircleMarker
          center={[sighting.latitude, sighting.longitude]}
          radius={10}
          pathOptions={{
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.9,
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  );
}
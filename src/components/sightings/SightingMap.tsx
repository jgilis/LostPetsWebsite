"use client";

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";

type Report = {
  latitude: number;
  longitude: number;
} | null;

type Sighting = {
  latitude: number;
  longitude: number;
};

type Props = {
  sighting: Sighting;
  report: Report;
};

export default function SightingMap({ sighting, report }: Props) {
  const sightingLat = sighting?.latitude ?? 0;
  const sightingLng = sighting?.longitude ?? 0;

  const reportLat = report?.latitude ?? sightingLat;
  const reportLng = report?.longitude ?? sightingLng;

  return (
    <div
      style={{
        height: 300,
        marginBottom: 20,
      }}
    >
      <MapContainer
        center={[sightingLat, sightingLng]}
        zoom={14}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* LOST LOCATION (BLUE) */}
        <CircleMarker
          center={[reportLat, reportLng]}
          radius={10}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.9,
            weight: 2,
          }}
        />

        {/* SIGHTING LOCATION (RED) */}
        <CircleMarker
          center={[sightingLat, sightingLng]}
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
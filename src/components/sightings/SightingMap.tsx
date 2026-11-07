"use client";

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";

type Report = {
  latitude: number;
  longitude: number;
} | null;

type Sighting = {
  latitude?: number | null;
  longitude?: number | null;
};

type Props = {
  sighting: Sighting;
  report: Report;
};

export default function SightingMap({ sighting, report }: Props) {
  const hasExactSighting =
    sighting.latitude != null &&
    sighting.longitude != null &&
    Number.isFinite(sighting.latitude) &&
    Number.isFinite(sighting.longitude);
  const sightingLat = hasExactSighting ? sighting.latitude! : null;
  const sightingLng = hasExactSighting ? sighting.longitude! : null;

  const reportLat = report?.latitude;
  const reportLng = report?.longitude;
  const centerLat = sightingLat ?? reportLat ?? 51.025;
  const centerLng = sightingLng ?? reportLng ?? 4.477;

  return (
    <div
      style={{
        height: 300,
        marginBottom: 20,
      }}
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* LOST LOCATION (BLUE) */}
        {reportLat != null && reportLng != null && (
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
        )}

        {!reportLat && (
          <div style={{ fontSize: 12, color: "#888" }}>
            No original lost location available
          </div>
        )}

        {sightingLat != null && sightingLng != null && (
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
        )}
      </MapContainer>
    </div>
  );
}
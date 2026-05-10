"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
} from "react-leaflet";

type Props = {
  sighting: any;
};

export default function SightingMap({
  sighting,
}: Props) {
  return (
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
        <CircleMarker
          center={[
            sighting.reports.latitude,
            sighting.reports.longitude,
          ]}
          radius={10}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.9,
            weight: 2,
          }}
        />

        {/* SIGHTING */}
        <CircleMarker
          center={[
            sighting.latitude,
            sighting.longitude,
          ]}
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
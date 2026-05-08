"use client";

import { useEffect, useState } from "react";

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  setLatitude: (lat: number) => void;
  setLongitude: (lng: number) => void;
}

export default function LocationPicker({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
}: LocationPickerProps) {
  const [MapParts, setMapParts] = useState<any>(null);

  // Load Leaflet ONLY on client
  useEffect(() => {
    async function loadMap() {
      const L = await import("leaflet");
      const {
        MapContainer,
        TileLayer,
        Marker,
        useMapEvents,
      } = await import("react-leaflet");

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x-blue.png",
        iconUrl: "/leaflet/marker-icon-blue.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const LocationMarker = () => {
        useMapEvents({
          click(e: any) {
            setLatitude(e.latlng.lat);
            setLongitude(e.latlng.lng);
          },
        });

        return (
          <Marker
            position={[latitude, longitude]}
            draggable={true}
            eventHandlers={{
              dragend: (e: any) => {
                const marker = e.target;
                const pos = marker.getLatLng();

                setLatitude(pos.lat);
                setLongitude(pos.lng);
              },
            }}
          />
        );
      };

      setMapParts({
        MapContainer,
        TileLayer,
        LocationMarker,
      });
    }

    loadMap();
  }, [latitude, longitude, setLatitude, setLongitude]);

  if (!MapParts) {
    return <p>Loading map...</p>;
  }

  const { MapContainer, TileLayer, LocationMarker } = MapParts;

  return (
    <div className="w-full max-w-full overflow-hidden rounded">
      <MapContainer
        center={[51.025, 4.477]} // Mechelen
        zoom={13}
        minZoom={11}
        maxZoom={16}
        maxBounds={[
          [50.90, 4.30], // SW
          [51.15, 4.65], // NE
        ]}
        maxBoundsViscosity={1.0}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker />
      </MapContainer>
    </div>
  );
}
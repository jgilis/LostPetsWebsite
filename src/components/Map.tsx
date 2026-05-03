"use client";

import { useState, useEffect, useMemo } from "react";
import type { Report } from "./useReports";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";

import { useReports } from "./useReports";
import { filterReports } from "./filters";
import CirclesLayer from "./CirclesLayer";
import { flagReport } from "../lib/flags";

export default function Map() {
  const { reports, loading } = useReports();

  const [L, setL] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [zoom, setZoom] = useState(13);

  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");
  const [animalFilter, setAnimalFilter] = useState<
    "all" | "dog" | "cat" | "bird" | "rodent" | "other"
  >("all");

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      setL(leaflet);
    });
  }, []);

  function ZoomWatcher() {
    const map = useMap();

    useEffect(() => {
      const update = () => setZoom(map.getZoom());

      update();
      map.on("zoomend", update);

      return () => {
        map.off("zoomend", update);
      };
    }, [map]);

    return null;
  }

  type AnimalType = "dog" | "cat" | "bird" | "rodent" | "other";

  const animalColors: Record<AnimalType, string> = {
    dog: "#3b82f6",
    cat: "#f59e0b",
    bird: "#a855f7",
    rodent: "#ef4444",
    other: "#111827",
  };

  const icons = useMemo<Record<AnimalType, any> | null>(() => {
    if (!L) return null;

    const createIcon = (url: string) =>
      new L.Icon({
        iconUrl: url,
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

    return {
      dog: createIcon("/leaflet/marker-icon-blue.png"),
      cat: createIcon("/leaflet/marker-icon-gold.png"),
      bird: createIcon("/leaflet/marker-icon-violet.png"),
      rodent: createIcon("/leaflet/marker-icon-red.png"),
      other: createIcon("/leaflet/marker-icon-black.png"),
    };
  }, [L]);

  const getIcon = (animal: AnimalType) => {
    if (!icons) return undefined;
    return icons[animal];
  };

  const filteredReports = filterReports(
    reports,
    typeFilter,
    animalFilter
  );

  const isClusterMode = zoom <= 13;
  const isDetailMode = zoom >= 14;

  const renderPopup = (r: Report) => (
    <div style={{ maxWidth: "200px" }}>
      <strong>{r.type}</strong> {r.animal_type}
      <br />

      {r.animal_name && (
        <>
          Name: {r.animal_name}
          <br />
        </>
      )}

      {r.description && <em>{r.description}</em>}
      <br />

      {r.photo_url && (
        <div style={{ marginTop: "8px" }}>
          <img
            src={r.photo_url}
            alt={r.animal_type}
            style={{
              width: "100%",
              borderRadius: "6px",
              marginTop: "4px",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "6px",
        }}
      >
        {/* CONTACT */}
        <div style={{ wordBreak: "break-word" }}>
          Contact: {r.contact_info}
        </div>

        {/* REPORT BUTTON */}
        <button
          onClick={async () => {
            const reason = prompt("Why are you reporting this post?");
            if (!reason) return;

            const ok = await flagReport(r.id, reason);

            if (ok) {
              alert("Report submitted. Thank you.");
            } else {
              alert("Failed to submit report.");
            }
          }}
          style={{
            padding: "6px 10px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Report this post
        </button>
      </div>
    </div>
  );

  if (!isMounted) return null;
  if (!L || !icons) return <p>Loading map...</p>;
  if (loading) return <p>Loading reports...</p>;

  return (
    <div>

      {/* 🧩 FILTER UI (RESTORED) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "10px",
          alignItems: "center",
        }}
      >

        {/* ANIMAL FILTER (TOP — unchanged colors) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "center",
            paddingTop: "6px", // 🔥 IMPORTANT: prevents top-edge clipping illusion
          }}
        >
          {(["all", "dog", "cat", "bird", "rodent", "other"] as const).map((a) => {
            const isActive = animalFilter === a;

            const color =
              a === "all"
                ? "#6b7280"
                : animalColors[a as keyof typeof animalColors];

            return (
              <button
                key={a}
                onClick={() => setAnimalFilter(a as any)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontWeight: 500,

                  border: `4px solid ${color}`,

                  backgroundColor: isActive ? color : "#ffffff",
                  color: isActive ? "#ffffff" : "#000000",

                  // 🔥 FIX: replaces fragile outline system
                  boxShadow: "0 0 0 2px #ffffff",

                  lineHeight: "normal",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {a.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* TYPE FILTER (BOTTOM) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            paddingTop: "4px",
          }}
        >
          {["all", "lost", "found"].map((t) => {
            const isActive = typeFilter === t;
            const color = "#000000";

            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t as any)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontWeight: 500,
                  boxSizing: "border-box",

                  lineHeight: "normal",
                  display: "inline-flex",
                  alignItems: "center",

                  border: `4px solid ${color}`,

                  backgroundColor: isActive ? "#000000" : "#ffffff",
                  color: isActive ? "#ffffff" : "#000000",

                  boxShadow: "0 0 0 2px #ffffff",
                }}
              >
                {t.toUpperCase()}
              </button>
            );
          })}
        </div>

      </div>

      {/* MAP */}
      <MapContainer
        center={[51.025, 4.477]} // Mechelen
        zoom={13}
        minZoom={10}
        maxZoom={16}
        maxBounds={[
          [50.75, 4.10], // SW (expanded)
          [51.30, 4.80], // NE (expanded)
        ]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        style={{ height: "60vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ZoomWatcher />

        <CirclesLayer
          reports={filteredReports}
          enabled={isDetailMode}
          getColor={(type: AnimalType) => animalColors[type]}
        />

        {isClusterMode && (
          <MarkerClusterGroup
            showCoverageOnHover={false}
            spiderfyOnHover={false}
            zoomToBoundsOnClick={true}
            polygonOptions={{
              color: "#3b82f6",
              weight: 0,
              opacity: 0,
              fillOpacity: 0,
            }}
          >
            {filteredReports.map((r) =>
              r.type === "found" ? (
                <CircleMarker
                  key={r.id}
                  center={[r.latitude, r.longitude]}
                  radius={6}
                  pathOptions={{
                    color: animalColors[r.animal_type],
                    fillColor: animalColors[r.animal_type],
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                >
                  <Popup>{renderPopup(r)}</Popup>
                </CircleMarker>
              ) : (
                <Marker
                  key={r.id}
                  position={[r.latitude, r.longitude]}
                  icon={getIcon(r.animal_type)}
                >
                  <Popup>{renderPopup(r)}</Popup>
                </Marker>
              )
            )}
          </MarkerClusterGroup>
        )}

        {isDetailMode &&
        filteredReports.map((r) =>
          r.type === "found" ? (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={6}
              pathOptions={{
                color: animalColors[r.animal_type],
                fillColor: animalColors[r.animal_type],
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>{renderPopup(r)}</Popup>
            </CircleMarker>
          ) : (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={getIcon(r.animal_type)}
            >
              <Popup>{renderPopup(r)}</Popup>
            </Marker>
          )
        )}
      </MapContainer>
    </div>
  );
}
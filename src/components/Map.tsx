"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import ReportPopup from "./ReportPopup";
import ReportMarker from "./ReportMarker";
import MapStateWatcher from "./MapStateWatcher";
import ReportsLayer from "./ReportsLayer";
import { useSupercluster } from "./useSupercluster";
import MapRefBridge from "./MapRefBridge";
import type { Map as LeafletMap } from "leaflet";


export default function Map() {
  const { reports, loading } = useReports();

  const [L, setL] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [map, setMap] = useState<LeafletMap | null>(null);
  const [mapState, setMapState] = useState<{
    zoom: number;
    bounds: [number, number, number, number] | null;
  }>({
    zoom: 13,
    bounds: null,
  });

  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");
  const [animalFilter, setAnimalFilter] = useState<
    "all" | "dog" | "cat" | "bird" | "rodent" | "other"
  >("all");

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

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

  const zoom = mapState.zoom;
  const bounds = mapState.bounds;
  const isDetailMode = mapState.zoom >= 13.5;
  const { clusters, index } = useSupercluster({
    reports: filteredReports,
    zoom: mapState.zoom,
    bounds: mapState.bounds, // ✅ already correct format
  });
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
          justifyContent: "center",
          paddingTop: "6px",
          maxWidth: "100%",
          width: "100%",
        }}
      >

        {/* ANIMAL FILTER (TOP — unchanged colors) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: isMobile ? "nowrap" : "wrap",
            overflowX: isMobile ? "auto" : "visible",
            justifyContent: isMobile ? "flex-start" : "center",
            width: "100%",
            paddingTop: "6px",
            paddingBottom: "4px",
            paddingLeft: isMobile ? "8px" : "0",
            paddingRight: isMobile ? "8px" : "0",
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
                  padding: "5px 10px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontWeight: 500,
                  whiteSpace: "nowrap",

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
            justifyContent: "center",
            width: "100%",
            paddingBottom: "10px",
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
                  padding: "6px 10px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontWeight: 500,
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",

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

        {/* 🧠 THIS IS THE MISSING PIECE */}
        <MapRefBridge setMap={setMap} />

        <MapStateWatcher onChange={setMapState} />

        <CirclesLayer
          reports={filteredReports}
          enabled={isDetailMode}
          getColor={(type: AnimalType) => animalColors[type]}
        />

        <ReportsLayer
          items={clusters}
          animalColors={animalColors}
          getIcon={getIcon}
          index={index}
          map={map}
          onClusterClick={(id, lat, lng) => {
            if (!map) return;

            const expansionZoom = index.getClusterExpansionZoom(id);

            map.setView([lat, lng], expansionZoom, {
              animate: true,
            });
          }}
        />
      </MapContainer>
    </div>
  );
}
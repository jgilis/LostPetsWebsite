"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { useReports } from "../report/useReports";
import { filterReports } from "./filters";
import CirclesLayer from "./CirclesLayer";
import MapStateWatcher from "./MapStateWatcher";
import ReportsLayer from "./ReportsLayer";
import { useSupercluster } from "./useSupercluster";
import MapRefBridge from "./MapRefBridge";
import type { Map as LeafletMap } from "leaflet";
import useLeaflet from "../../hooks/useLeaflet";
import { useSearchParams } from "next/navigation";

function MapClickCloser() {
  useMapEvents({
    click(map) {
      map.target.closePopup();
    },
  });

  return null;
}

export default function Map() {
  const { reports, loading } = useReports();

  const [isMounted, setIsMounted] = useState(false);

  type MapState = {
    zoom: number;
    bounds: [number, number, number, number] | null;
  };
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [mapState, setMapState] = useState<MapState>({
    zoom: 13,
    bounds: null,
  });

  const handleMapStateChange = useCallback((state: MapState) => {
    setMapState(state);
  }, []);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");
  const [animalFilter, setAnimalFilter] = useState<
    "all" | "dog" | "cat" | "bird" | "rodent" | "other"
  >("all");

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  useEffect(() => setIsMounted(true), []);

  const L = useLeaflet();

  type AnimalType = "dog" | "cat" | "bird" | "rodent" | "other";

  const animalColors: Record<AnimalType, string> = {
    dog: "#3b82f6",
    cat: "#f59e0b",
    bird: "#a855f7",
    rodent: "#ef4444",
    other: "#111827",
  };

  const searchParams = useSearchParams();

  const focusSighting =
    searchParams.get("focusSighting");

  const focusReport =
    searchParams.get("focusReport");

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

  const sightingIcon = useMemo(() => {
    if (!L) return null;
    return new L.Icon({
      iconUrl: "/leaflet/marker-icon-red.png",
      shadowUrl: "/leaflet/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  }, [L]);

  const filteredReports = filterReports(
    reports,
    typeFilter,
    animalFilter
  );
  const focusedReport = reports.find(
    (r) => r.id === focusReport
  );

  const relevantReports = useMemo(() => {
    if (!focusReport) return reports;

    return reports.filter((r) => {
      // always include target report
      if (r.id === focusReport) return true;

      // include sightings linked to it
      if (r.id === focusSighting) return true;

      // optional: include nearby context (simple radius filter later)
      return false;
    });
  }, [reports, focusReport, focusSighting]);

  useEffect(() => {
    if (!map || !focusReport) return;

    const target = relevantReports.find(
      (r) => r.id === focusReport
    );

    if (!target) return;

    map.setView(
      [target.latitude, target.longitude],
      15,
      { animate: true }
    );

    setSelectedReport(target.id);
  }, [map, focusReport, relevantReports]);

  const zoom = mapState.zoom;
  const bounds = mapState.bounds;
  const isDetailMode = mapState.zoom >= 13.5;
  
  const activeReports =
    focusReport ? relevantReports : filteredReports;

  const isFocusMode = !!focusReport;

  const { clusters, index } = useSupercluster({
    reports: activeReports,
    zoom: mapState.zoom,
    bounds: mapState.bounds,
  });

  const selected = filteredReports.find(
    (r) => r.id === selectedReport
  );

  if (!isMounted) return null;
  if (!L || !icons) return <p>Loading map...</p>;
  if (loading) return <p>Loading reports...</p>;

  // DELETE LATER, WHEN WE USE ACTUAL SIGHTING COORDINATES
  const sightingMarkers =
  focusSighting && focusReport
    ? [{
        id: focusSighting,
        lat: 51.02, // placeholder until we fetch real sighting
        lng: 4.48
      }]
    : [];

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

          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "black",
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
        preferCanvas={true}
        scrollWheelZoom={true}
        style={{ height: "60vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapRefBridge setMap={setMap} />
        <MapStateWatcher onChange={setMapState} />
        <MapClickCloser />

        {sightingMarkers.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={sightingIcon}
          />
        ))}

        <CirclesLayer
          reports={isFocusMode ? relevantReports : filteredReports}
          enabled={isDetailMode && !isFocusMode}
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

function MapClickHandler({
  onClick,
}: {
  onClick: () => void;
}) {
  useMapEvents({
    click: () => {
      onClick();
    },
  });

  return null;
}
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
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
import { useMapIcons } from "./useMapIcons";
import { useMapFocus } from "./useMapFocus";
import { useReportSightings } from "./useReportSightings";
import type { MapProps } from "./mapTypes";
import AdminMapLegend from "./AdminMapLegend";
import PopupViewGuard from "./PopupViewGuard";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

const ANIMAL_FILTER_LABELS: Record<
  "all" | "dog" | "cat" | "bird" | "rodent" | "other",
  TranslationKey
> = {
  all: "filterAll",
  dog: "filterDog",
  cat: "filterCat",
  bird: "filterBird",
  rodent: "filterRodent",
  other: "filterOther",
};

const TYPE_FILTER_LABELS: Record<"all" | "lost" | "found", TranslationKey> = {
  all: "filterAll",
  lost: "filterLost",
  found: "filterFound",
};

function MapClickCloser() {
  const wasDraggedRef = useRef(false);

  useMapEvents({
    dragstart() {
      wasDraggedRef.current = true;
    },
    dragend() {
      window.setTimeout(() => {
        wasDraggedRef.current = false;
      }, 100);
    },
    click(map) {
      if (wasDraggedRef.current) return;

      map.target.closePopup();
    },
  });

  return null;
}

export default function Map({
  mode: modeProp,
  reportId: reportIdProp,
  typeFilter: typeFilterProp,
  animalFilter: animalFilterProp,
  onTypeFilterChange,
  onAnimalFilterChange,
  hideFilters = false,
}: MapProps) {
  const searchParams = useSearchParams();

  const mode =
    modeProp ??
    (searchParams.get("mapMode") === "admin-scoped"
      ? "admin-scoped"
      : "default");

  const scopedReportId =
    reportIdProp ?? searchParams.get("focusReport");

  const isAdminScoped =
    mode === "admin-scoped" && !!scopedReportId;

  const { reports, loading: reportsLoading } = useReports(
    isAdminScoped ? { reportId: scopedReportId } : undefined
  );

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

  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const [internalTypeFilter, setInternalTypeFilter] = useState<
    "all" | "lost" | "found"
  >("all");
  const [internalAnimalFilter, setInternalAnimalFilter] = useState<
    "all" | "dog" | "cat" | "bird" | "rodent" | "other"
  >("all");

  const filtersControlled =
    onTypeFilterChange != null && onAnimalFilterChange != null;
  const typeFilter = filtersControlled
    ? (typeFilterProp ?? "all")
    : internalTypeFilter;
  const animalFilter = filtersControlled
    ? (animalFilterProp ?? "all")
    : internalAnimalFilter;
  const setTypeFilter = filtersControlled
    ? onTypeFilterChange
    : setInternalTypeFilter;
  const setAnimalFilter = filtersControlled
    ? onAnimalFilterChange
    : setInternalAnimalFilter;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const { t } = useTranslation();

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

  const focusSighting = searchParams.get("focusSighting");

  const {
    icons,
    getIcon,
    sightingIcon,
    reportOriginIcon,
    currentSightingIcon,
  } = useMapIcons(L);
  const { sightingMarkers: focusSightingMarkers } = useMapFocus(
    isAdminScoped ? null : focusSighting
  );
  const {
    sightingMarkers: scopedSightingMarkers,
    loading: sightingsLoading,
  } = useReportSightings(isAdminScoped ? scopedReportId : null);

  const sightingMarkers = isAdminScoped
    ? scopedSightingMarkers
    : focusSightingMarkers;

  const focusReport = scopedReportId;

  const filteredReports = filterReports(
    reports,
    typeFilter,
    animalFilter
  );
  const focusedReport = reports.find(
    (r) => r.id === focusReport
  );

  useEffect(() => {
    if (!map || !focusedReport) return;
    map.setView(
      [focusedReport.latitude, focusedReport.longitude],
      15,
      { animate: true }
    );
    setSelectedReport(focusedReport.id);
  }, [map, focusedReport]);

  const zoom = mapState.zoom;
  const bounds = mapState.bounds;
  const isDetailMode = mapState.zoom >= 13.5;
  const activeReports = filteredReports;
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
  if (!L || !icons || !sightingIcon) return <p>{t("mapLoading")}</p>;
  if (
    isAdminScoped &&
    (!reportOriginIcon || !currentSightingIcon)
  ) {
    return <p>{t("mapLoading")}</p>;
  }
  const loading = reportsLoading || (isAdminScoped && sightingsLoading);

  if (loading) return <p>{t("reportsLoading")}</p>;

  return (
    <div>

      {!hideFilters && (
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
          zIndex: 400,
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
                {t(ANIMAL_FILTER_LABELS[a]).toUpperCase()}
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
          {(["all", "lost", "found"] as const).map((typeKey) => {
            const isActive = typeFilter === typeKey;
            const color = "#000000";

            return (
              <button
                key={typeKey}
                onClick={() => setTypeFilter(typeKey as any)}
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
                {t(TYPE_FILTER_LABELS[typeKey]).toUpperCase()}
              </button>
            );
          })}
        </div>

      </div>
      )}

      {/* MAP */}
      <div style={{ position: "relative" }}>
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
        <PopupViewGuard />

        {sightingMarkers.map((s) => {
          const isCurrentSighting =
            isAdminScoped && s.id === focusSighting;
          const isPastSighting =
            isAdminScoped && s.id !== focusSighting;

          if (isPastSighting) {
            return (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lng]}
                radius={7}
                pathOptions={{
                  color: "#dc2626",
                  fillColor: "#dc2626",
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              />
            );
          }

          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={
                isCurrentSighting
                  ? currentSightingIcon
                  : sightingIcon
              }
            />
          );
        })}

        <CirclesLayer
          reports={filteredReports}
          enabled={isDetailMode && !isFocusMode}
          getColor={(type: AnimalType) => animalColors[type]}
        />

        <ReportsLayer
          items={clusters}
          animalColors={animalColors}
          getIcon={getIcon}
          reportIconOverride={
            isAdminScoped ? reportOriginIcon : undefined
          }
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

      {isAdminScoped && <AdminMapLegend />}
      </div>
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
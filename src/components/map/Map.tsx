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
import { useReportUrlFocus } from "./useReportUrlFocus";
import NearbyAwareness from "../nearby/NearbyAwareness";
import WalkingModeMapLayers from "./WalkingModeMapLayers";
import { isPublicMapReport } from "@/src/lib/reports";
import { useReportSightings } from "./useReportSightings";
import type { MapProps } from "./mapTypes";
import AdminMapLegend from "./AdminMapLegend";
import DiscoverMapLegend from "./DiscoverMapLegend";
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

function MapClickCloser({
  onBackgroundClick,
}: {
  onBackgroundClick?: () => void;
}) {
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
      onBackgroundClick?.();
    },
  });

  return null;
}

export default function Map({
  mode: modeProp,
  reportId: reportIdProp,
  refreshKey = 0,
  typeFilter: typeFilterProp,
  animalFilter: animalFilterProp,
  onTypeFilterChange,
  onAnimalFilterChange,
  hideFilters = false,
  walkingMode,
  fillContainer = false,
  selectedReportId = null,
  onSelectedReportChange,
  onDiscoverViewChange,
}: MapProps) {
  const searchParams = useSearchParams();

  const mode =
    modeProp ??
    (searchParams.get("mapMode") === "admin-scoped"
      ? "admin-scoped"
      : "default");

  const scopedReportId =
    reportIdProp ??
    (searchParams.get("mapMode") === "admin-scoped"
      ? searchParams.get("focusReport")
      : null);

  const focusReportId =
    searchParams.get("focus") ??
    scopedReportId ??
    null;

  const isAdminScoped =
    mode === "admin-scoped" && !!scopedReportId;

  const { reports, loading: reportsLoading } = useReports(
    isAdminScoped
      ? { reportId: scopedReportId, refreshKey }
      : { refreshKey },
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

  const filteredReports = filterReports(
    reports,
    typeFilter,
    animalFilter
  );

  const filteredReportIdsRef = useRef<ReadonlySet<string>>(new Set());
  filteredReportIdsRef.current = new Set(
    filteredReports.map((report) => report.id),
  );

  const { popupTargetId, popupOpenToken } = useReportUrlFocus({
    map,
    reportsLoading,
    reports,
    focusReportId,
    filteredReportIdsRef,
  });

  const zoom = mapState.zoom;
  const bounds = mapState.bounds;
  const isDetailMode = mapState.zoom >= 13.5;
  const activeReports = filteredReports;
  const isFocusMode = !!focusReportId;

  const { clusters, index } = useSupercluster({
    reports: activeReports,
    zoom: mapState.zoom,
    bounds: mapState.bounds,
  });

  const lastDiscoverViewKeyRef = useRef("");
  useEffect(() => {
    if (!onDiscoverViewChange) return;
    const bounds = mapState.bounds;
    const key = `${bounds?.join(",") ?? "none"}|${activeReports
      .map((report) => report.id)
      .join(",")}|${reports.map((report) => report.id).join(",")}`;
    if (key === lastDiscoverViewKeyRef.current) return;
    lastDiscoverViewKeyRef.current = key;
    onDiscoverViewChange({
      bounds,
      filteredReports: activeReports,
      reports,
    });
  }, [activeReports, mapState.bounds, onDiscoverViewChange, reports]);

  const mapCenterLocation = useMemo(() => {
    if (!bounds) {
      return { lat: 51.025, lng: 4.477 };
    }

    const [west, south, east, north] = bounds;
    return {
      lat: (south + north) / 2,
      lng: (west + east) / 2,
    };
  }, [bounds]);

  const mapProximityReports = useMemo(
    () => reports.filter(isPublicMapReport),
    [reports],
  );

  const isWalkingSearch =
    !isAdminScoped && walkingMode.isWalkingModeEnabled;
  const lastLivePositionRef = useRef(walkingMode.livePosition);

  useEffect(() => {
    if (walkingMode.livePosition) {
      lastLivePositionRef.current = walkingMode.livePosition;
    }
  }, [walkingMode.livePosition]);

  const walkingOverlayPosition =
    walkingMode.livePosition ?? lastLivePositionRef.current;
  const showWalkingLayers = isWalkingSearch && walkingOverlayPosition != null;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("walking-mode-active", isWalkingSearch);
    return () => document.body.classList.remove("walking-mode-active");
  }, [isWalkingSearch]);

  useEffect(() => {
    if (!map) return;
    const maxZoom = isWalkingSearch ? 18 : 16;
    map.setMaxZoom(maxZoom);
    if (map.getZoom() > maxZoom) {
      map.setZoom(maxZoom);
    }
  }, [map, isWalkingSearch]);

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    const host = container.parentElement;
    if (!host) return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(host);
    map.invalidateSize();
    return () => observer.disconnect();
  }, [map]);

  const handleRecenter = useCallback(() => {
    walkingMode.enableFollowMode();
    const position = walkingMode.livePosition ?? lastLivePositionRef.current;
    if (!map || !position) return;

    map.panTo([position.lat, position.lng], { animate: true });
    window.dispatchEvent(new Event("walking-map-recenter"));
  }, [map, walkingMode]);

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
    <div
      className={
        fillContainer ? "relative flex h-full min-h-0 flex-col" : undefined
      }
    >

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
            justifyContent: "center",
            width: "100%",
            minWidth: 0,
            overflowX: "hidden",
            paddingTop: "4px",
            paddingBottom: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: "8px",
              width: "max-content",
              maxWidth: "100%",
              minWidth: 0,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorX: "contain",
              touchAction: "pan-x",
              paddingLeft: "8px",
              paddingRight: "8px",
              paddingTop: "4px",
              paddingBottom: "4px",
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
                  flexShrink: 0,

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
      <div
        className={`walking-map-host relative ${
          fillContainer ? "min-h-0 flex-1" : ""
        }`}
        style={{ position: "relative" }}
      >
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
        className={
          isWalkingSearch || fillContainer ? "walking-map-container" : undefined
        }
        style={
          isWalkingSearch || fillContainer
            ? { height: "100%", width: "100%" }
            : { height: "60vh", width: "100%" }
        }
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapRefBridge setMap={setMap} />
        <MapStateWatcher onChange={setMapState} />
        <MapClickCloser
          onBackgroundClick={() => onSelectedReportChange?.(null)}
        />
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
          popupTargetId={isAdminScoped ? popupTargetId : null}
          popupOpenToken={isAdminScoped ? popupOpenToken : 0}
          enablePopup={isAdminScoped}
          selectedReportId={selectedReportId}
          onSelectReport={(id) => onSelectedReportChange?.(id)}
          onClusterClick={(id, lat, lng) => {
            if (!map) return;

            const expansionZoom = index.getClusterExpansionZoom(id);

            map.setView([lat, lng], expansionZoom, {
              animate: true,
            });
          }}
        />

        {showWalkingLayers && walkingOverlayPosition ? (
          <WalkingModeMapLayers
            livePosition={walkingOverlayPosition}
            isFollowModeEnabled={walkingMode.isFollowModeEnabled}
            onManualPan={walkingMode.disableFollowMode}
          />
        ) : null}
      </MapContainer>

      {showWalkingLayers ? (
        <button
          type="button"
          onClick={handleRecenter}
          className="walking-recenter-btn absolute right-3 z-[500] min-h-11 rounded-md bg-gray-900/90 px-3 py-2 text-xs font-medium text-gray-100 shadow ring-1 ring-gray-600 hover:bg-gray-800"
          aria-label="Recenter on your location"
        >
          Recenter
        </button>
      ) : null}

      {isAdminScoped ? (
        <AdminMapLegend />
      ) : (
        <div className="discover-map-tool-stack pointer-events-none absolute top-2 right-2 z-[510] flex flex-col items-end gap-2">
          <div className="pointer-events-auto">
            <DiscoverMapLegend />
          </div>
          {fillContainer ? (
            <div className="pointer-events-auto flex flex-col items-end gap-2 md:hidden">
              <NearbyAwareness
                overlay
                centerLocation={mapCenterLocation}
                reports={mapProximityReports}
                walkingMode={walkingMode}
              />
              <button
                type="button"
                className="discover-map-tool-btn"
                aria-pressed={walkingMode.isWalkingModeEnabled}
                onClick={() => {
                  if (walkingMode.isWalkingModeEnabled) {
                    walkingMode.stopWalkingMode();
                  } else {
                    walkingMode.startWalkingMode();
                  }
                }}
              >
                {t("discoverWalking")}
              </button>
            </div>
          ) : null}
        </div>
      )}
      </div>

      {!isAdminScoped && !fillContainer ? (
        <NearbyAwareness
          centerLocation={mapCenterLocation}
          reports={mapProximityReports}
          walkingMode={walkingMode}
        />
      ) : null}
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
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapWrapper from "../map/MapWrapper";
import type { DiscoverViewState } from "../map/mapTypes";
import type {
  AnimalFilter,
  TypeFilter,
} from "../report/ReportFiltersBar";
import type { UseWalkingModeResult } from "@/src/hooks/useWalkingMode";
import DiscoverReportsPane from "./DiscoverReportsPane";
import DiscoverDetailSheet from "./DiscoverDetailSheet";

type DiscoverWorkspaceProps = {
  refreshKey: number;
  typeFilter: TypeFilter;
  animalFilter: AnimalFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  onAnimalFilterChange: (value: AnimalFilter) => void;
  walkingMode: UseWalkingModeResult;
  onViewChange?: (view: DiscoverViewState) => void;
};

export default function DiscoverWorkspace({
  refreshKey,
  typeFilter,
  animalFilter,
  onTypeFilterChange,
  onAnimalFilterChange,
  walkingMode,
  onViewChange,
}: DiscoverWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const adminScoped = searchParams.get("mapMode") === "admin-scoped";
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    focusId,
  );
  const [detailOpen, setDetailOpen] = useState(!!focusId);
  const [view, setView] = useState<DiscoverViewState>({
    bounds: null,
    filteredReports: [],
    reports: [],
  });

  const clearFocusFromUrl = useCallback(() => {
    if (!searchParams.get("focus")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("focus");
    if (!next.get("tab")) next.set("tab", "discover");
    const query = next.toString();
    router.replace(query ? `/?${query}` : "/?tab=discover", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!focusId) return;
    setSelectedReportId(focusId);
    setDetailOpen(true);
  }, [focusId]);

  const handleDiscoverViewChange = useCallback(
    (next: DiscoverViewState) => {
      setView(next);
      onViewChange?.(next);
    },
    [onViewChange],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedReportId(id);
    setDetailOpen(true);
  }, []);

  const handleSelectedReportChange = useCallback(
    (id: string | null) => {
      setSelectedReportId(id);
      setDetailOpen(!!id);
      if (!id) clearFocusFromUrl();
    },
    [clearFocusFromUrl],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    clearFocusFromUrl();
  }, [clearFocusFromUrl]);

  const sortOrigin = useMemo(() => {
    if (!walkingMode.isWalkingModeEnabled) return null;
    const position = walkingMode.livePosition;
    if (!position) return null;
    return { lat: position.lat, lng: position.lng };
  }, [walkingMode.isWalkingModeEnabled, walkingMode.livePosition]);

  const detailReport =
    view.reports.find((report) => report.id === selectedReportId) ??
    view.filteredReports.find((report) => report.id === selectedReportId) ??
    null;

  return (
    <div className="discover-map-stage relative flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="home-map-shell relative min-h-0 flex-1">
        <MapWrapper
          refreshKey={refreshKey}
          typeFilter={typeFilter}
          animalFilter={animalFilter}
          onTypeFilterChange={onTypeFilterChange}
          onAnimalFilterChange={onAnimalFilterChange}
          hideFilters
          walkingMode={walkingMode}
          fillContainer
          selectedReportId={selectedReportId}
          onSelectedReportChange={handleSelectedReportChange}
          onDiscoverViewChange={handleDiscoverViewChange}
        />
      </div>
      {adminScoped ? null : (
        <>
          <DiscoverReportsPane
            bounds={view.bounds}
            filteredReports={view.filteredReports}
            selectedReportId={selectedReportId}
            onSelect={handleSelect}
            sortOrigin={sortOrigin}
            typeFilter={typeFilter}
            animalFilter={animalFilter}
            onTypeFilterChange={onTypeFilterChange}
            onAnimalFilterChange={onAnimalFilterChange}
          />
          {detailOpen && detailReport ? (
            <DiscoverDetailSheet
              report={detailReport}
              onClose={handleCloseDetail}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

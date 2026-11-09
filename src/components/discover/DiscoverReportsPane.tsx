"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { Report } from "@/src/lib/reports";
import {
  centerFromBounds,
  filterReportsInBounds,
  type MapBoundsBox,
} from "@/src/lib/geo/reportInBounds";
import {
  sortDiscoverReports,
  type DiscoverSortOrigin,
} from "@/src/lib/geo/sortDiscoverReports";
import {
  DEFAULT_NEARBY_RADIUS_METERS,
  getNearbyReports,
} from "@/src/lib/geo/getNearbyReports";
import {
  browserGetCurrentPosition,
  isBrowserGeolocationAvailable,
} from "@/src/lib/platform/browserGeolocation";
import type { GeoPoint } from "@/src/lib/geo/isWithinRadius";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type {
  AnimalFilter,
  TypeFilter,
} from "../report/ReportFiltersBar";
import DiscoverReportCard from "./DiscoverReportCard";
import DiscoverDesktopToolbar, {
  type NearbySource,
} from "./DiscoverDesktopToolbar";

export type DiscoverSheetSnap = "collapsed" | "partial" | "expanded";

const COLLAPSED_PX = 72;
const PARTIAL_FRACTION = 0.42;
const EXPANDED_FRACTION = 0.86;

type DiscoverReportsPaneProps = {
  bounds: MapBoundsBox | null;
  filteredReports: Report[];
  selectedReportId: string | null;
  onSelect: (id: string) => void;
  sortOrigin: DiscoverSortOrigin | null;
  typeFilter: TypeFilter;
  animalFilter: AnimalFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  onAnimalFilterChange: (value: AnimalFilter) => void;
};

function snapHeight(hostHeight: number, snap: DiscoverSheetSnap): number {
  if (snap === "collapsed") return COLLAPSED_PX;
  if (snap === "partial") {
    return Math.max(COLLAPSED_PX, Math.round(hostHeight * PARTIAL_FRACTION));
  }
  return Math.max(COLLAPSED_PX, Math.round(hostHeight * EXPANDED_FRACTION));
}

function nearestSnap(hostHeight: number, height: number): DiscoverSheetSnap {
  const candidates: DiscoverSheetSnap[] = [
    "collapsed",
    "partial",
    "expanded",
  ];
  let best: DiscoverSheetSnap = "partial";
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const snap of candidates) {
    const delta = Math.abs(snapHeight(hostHeight, snap) - height);
    if (delta < bestDelta) {
      best = snap;
      bestDelta = delta;
    }
  }
  return best;
}

function DiscoverReportList({
  reports,
  selectedReportId,
  onSelect,
  emptyLabel,
  ready,
}: {
  reports: Report[];
  selectedReportId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
  ready: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedReportId || !listRef.current) return;
    const card = listRef.current.querySelector(
      `[data-report-id="${CSS.escape(selectedReportId)}"]`,
    );
    card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedReportId]);

  if (!ready) {
    return null;
  }

  if (reports.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-gray-400">{emptyLabel}</p>
    );
  }

  return (
    <div ref={listRef} className="space-y-2 px-3 pb-3">
      {reports.map((report) => (
        <DiscoverReportCard
          key={report.id}
          report={report}
          selected={report.id === selectedReportId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function DiscoverReportsPane({
  bounds,
  filteredReports,
  selectedReportId,
  onSelect,
  sortOrigin,
  typeFilter,
  animalFilter,
  onTypeFilterChange,
  onAnimalFilterChange,
}: DiscoverReportsPaneProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<DiscoverSheetSnap>("partial");
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [nearbySource, setNearbySource] = useState<NearbySource>("off");
  const [deviceOrigin, setDeviceOrigin] = useState<GeoPoint | null>(null);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    hostHeight: number;
    pointerId: number;
  } | null>(null);
  const didDragRef = useRef(false);

  const mapCenter = useMemo(() => centerFromBounds(bounds), [bounds]);
  const nearbyOrigin =
    nearbySource === "device"
      ? deviceOrigin
      : nearbySource === "map"
        ? mapCenter
        : null;

  const reports = useMemo(() => {
    if (nearbyOrigin) {
      return getNearbyReports(
        filteredReports,
        nearbyOrigin,
        DEFAULT_NEARBY_RADIUS_METERS,
      ).map((event) => event.report);
    }

    return sortDiscoverReports(
      filterReportsInBounds(filteredReports, bounds),
      sortOrigin,
    );
  }, [filteredReports, bounds, sortOrigin, nearbyOrigin]);

  const handleNearbySourceChange = (next: NearbySource) => {
    setNearbyError(null);
    if (next !== "device") {
      setNearbySource(next);
      return;
    }
    if (!isBrowserGeolocationAvailable()) {
      setNearbyError(t("discoverNearbyLocationDenied"));
      return;
    }
    browserGetCurrentPosition(
      (position) => {
        setDeviceOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setNearbySource("device");
      },
      () => {
        setNearbyError(t("discoverNearbyLocationDenied"));
      },
    );
  };

  useEffect(() => {
    if (selectedReportId && snap === "collapsed") {
      setSnap("partial");
    }
  }, [selectedReportId, snap]);

  useEffect(() => {
    const root = sheetRef.current?.offsetParent as HTMLElement | null;
    if (!root) return;
    const height = dragHeight ?? snapHeight(root.clientHeight, snap);
    root.style.setProperty("--discover-sheet-height", `${height}px`);
  }, [snap, dragHeight]);

  const applySheetHeight = (hostHeight: number, height: number) => {
    const clamped = Math.min(
      Math.max(height, COLLAPSED_PX),
      Math.round(hostHeight * EXPANDED_FRACTION),
    );
    setDragHeight(clamped);
    const root = sheetRef.current?.offsetParent as HTMLElement | null;
    root?.style.setProperty("--discover-sheet-height", `${clamped}px`);
  };

  const onHandlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const host = sheetRef.current?.offsetParent as HTMLElement | null;
    if (!host) return;
    const hostHeight = host.clientHeight;
    const startHeight = dragHeight ?? snapHeight(hostHeight, snap);
    didDragRef.current = false;
    dragRef.current = {
      startY: event.clientY,
      startHeight,
      hostHeight,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (Math.abs(event.clientY - drag.startY) > 8) {
      didDragRef.current = true;
    }
    const next = drag.startHeight + (drag.startY - event.clientY);
    applySheetHeight(drag.hostHeight, next);
  };

  const onHandlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const height = dragHeight ?? snapHeight(drag.hostHeight, snap);
    dragRef.current = null;
    setDragHeight(null);
    if (didDragRef.current) {
      setSnap(nearestSnap(drag.hostHeight, height));
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onHandleClick = () => {
    if (didDragRef.current) return;
    setSnap((current) =>
      current === "collapsed"
        ? "partial"
        : current === "partial"
          ? "expanded"
          : "collapsed",
    );
  };

  const host = sheetRef.current?.offsetParent as HTMLElement | null;
  const hostHeight = host?.clientHeight ?? 480;
  const sheetHeight = dragHeight ?? snapHeight(hostHeight, snap);
  const label = t("discoverReportsLabel");
  const emptyLabel = nearbyOrigin
    ? t("discoverNearbyEmpty")
    : t("discoverInViewEmpty");
  const listReady = nearbySource === "device" ? nearbyOrigin != null : bounds != null;

  return (
    <>
      <aside
        className="discover-reports-desktop hidden min-h-0 w-80 shrink-0 flex-col border-l border-gray-800 bg-gray-950 md:flex lg:w-96"
        aria-label={label}
      >
        <div className="shrink-0 space-y-2 border-b border-gray-800 px-3 py-3">
          <div className="text-sm font-medium text-gray-300">{label}</div>
          <DiscoverDesktopToolbar
            typeFilter={typeFilter}
            animalFilter={animalFilter}
            onTypeFilterChange={onTypeFilterChange}
            onAnimalFilterChange={onAnimalFilterChange}
            nearbySource={nearbySource}
            onNearbySourceChange={handleNearbySourceChange}
            nearbyError={nearbyError}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DiscoverReportList
            reports={reports}
            selectedReportId={selectedReportId}
            onSelect={onSelect}
            emptyLabel={emptyLabel}
            ready={listReady}
          />
        </div>
      </aside>

      <div
        ref={sheetRef}
        className="discover-report-sheet absolute inset-x-0 bottom-0 z-[520] flex flex-col overflow-hidden rounded-t-xl border-t border-gray-800 bg-gray-950 md:hidden"
        style={{ height: sheetHeight }}
      >
        <button
          type="button"
          className="flex min-h-[44px] w-full shrink-0 touch-none flex-col items-center justify-center px-3 py-2"
          aria-label={t("discoverSheetHandle")}
          aria-expanded={snap !== "collapsed"}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          onClick={onHandleClick}
        >
          <span className="mb-2 block h-1 w-10 rounded-full bg-gray-600" />
          <span className="text-xs font-medium text-gray-300">
            {label}
            {reports.length > 0 ? ` · ${reports.length}` : ""}
          </span>
        </button>
        {snap !== "collapsed" || dragHeight != null ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <DiscoverReportList
              reports={reports}
              selectedReportId={selectedReportId}
              onSelect={onSelect}
              emptyLabel={emptyLabel}
              ready={listReady}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Report } from "../report/useReports";

const FOCUS_ZOOM = 15;
const MOVEEND_FALLBACK_MS = 500;

type UseReportUrlFocusOptions = {
  map: LeafletMap | null;
  reportsLoading: boolean;
  reports: Report[];
  focusReportId: string | null;
  filteredReportIdsRef: RefObject<ReadonlySet<string>>;
};

export function useReportUrlFocus({
  map,
  reportsLoading,
  reports,
  focusReportId,
  filteredReportIdsRef,
}: UseReportUrlFocusOptions) {
  const lastAppliedFocusIdRef = useRef<string | null>(null);
  const moveEndHandlerRef = useRef<(() => void) | null>(null);
  const [popupTargetId, setPopupTargetId] = useState<string | null>(null);
  const [popupOpenToken, setPopupOpenToken] = useState(0);

  useEffect(() => {
    const detachMoveEnd = () => {
      if (map && moveEndHandlerRef.current) {
        map.off("moveend", moveEndHandlerRef.current);
        moveEndHandlerRef.current = null;
      }
    };

    if (!focusReportId) {
      detachMoveEnd();
      if (lastAppliedFocusIdRef.current !== null) {
        lastAppliedFocusIdRef.current = null;
        setPopupTargetId(null);
        map?.closePopup();
      }
      return;
    }

    if (!map || reportsLoading) {
      return;
    }

    if (focusReportId === lastAppliedFocusIdRef.current) {
      return;
    }

    const report = reports.find((r) => r.id === focusReportId);
    if (!report) {
      lastAppliedFocusIdRef.current = focusReportId;
      setPopupTargetId(null);
      map.closePopup();
      return;
    }

    lastAppliedFocusIdRef.current = focusReportId;
    detachMoveEnd();
    setPopupTargetId(null);
    map.closePopup();

    const openPopupIfVisible = () => {
      if (lastAppliedFocusIdRef.current !== focusReportId) return;

      if (filteredReportIdsRef.current.has(focusReportId)) {
        setPopupTargetId(focusReportId);
        setPopupOpenToken((token) => token + 1);
      } else {
        setPopupTargetId(null);
        map.closePopup();
      }
    };

    const onMoveEnd = () => {
      detachMoveEnd();
      openPopupIfVisible();
    };

    moveEndHandlerRef.current = onMoveEnd;
    map.once("moveend", onMoveEnd);

    map.setView([report.latitude, report.longitude], FOCUS_ZOOM, {
      animate: true,
    });

    const fallbackTimer = window.setTimeout(() => {
      if (moveEndHandlerRef.current === onMoveEnd) {
        onMoveEnd();
      }
    }, MOVEEND_FALLBACK_MS);

    return () => {
      window.clearTimeout(fallbackTimer);
      detachMoveEnd();
    };
  }, [map, reportsLoading, focusReportId, reports, filteredReportIdsRef]);

  return { popupTargetId, popupOpenToken };
}

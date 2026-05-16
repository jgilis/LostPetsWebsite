import { useCallback, useEffect, useState } from "react";
import { getApprovedSightings } from "../../lib/sightings";
import { useVisibilitySyncRegister } from "../sync/VisibilitySyncProvider";
import { useRealtimeResyncRegister } from "../sync/RealtimeResyncProvider";

export type SightingMarker = {
  id: string;
  lat: number;
  lng: number;
};

export function useReportSightings(reportId: string | null) {
  const [sightingMarkers, setSightingMarkers] = useState<SightingMarker[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const loadSightings = useCallback(async () => {
    if (!reportId) {
      setSightingMarkers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getApprovedSightings(reportId);
    setSightingMarkers(
      data.map((s) => ({
        id: s.id,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
      })),
    );
    setLoading(false);
  }, [reportId]);

  useEffect(() => {
    void loadSightings();
  }, [loadSightings]);

  useVisibilitySyncRegister(() => {
    void loadSightings();
  }, [loadSightings]);

  useRealtimeResyncRegister(() => {
    void loadSightings();
  }, [loadSightings]);

  return { sightingMarkers, loading };
}

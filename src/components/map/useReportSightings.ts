import { useEffect, useState } from "react";
import { getApprovedSightings } from "../../lib/sightings";

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

  useEffect(() => {
    if (!reportId) {
      setSightingMarkers([]);
      return;
    }

    const scopedReportId = reportId;

    let active = true;
    setLoading(true);

    async function load() {
      const data = await getApprovedSightings(scopedReportId);

      if (!active) return;

      setSightingMarkers(
        data.map((s) => ({
          id: s.id,
          lat: Number(s.latitude),
          lng: Number(s.longitude),
        }))
      );
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [reportId]);

  return { sightingMarkers, loading };
}

import { useEffect, useState } from "react";
import { getPublicSightingById } from "../../lib/sightings";

export function useMapFocus(focusSighting: string | null) {
  const [focusedSighting, setFocusedSighting] = useState<any>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!focusSighting) return;

      const data = await getPublicSightingById(focusSighting);

      if (!active) return;
      setFocusedSighting(data);
    }

    load();

    return () => {
      active = false;
    };
  }, [focusSighting]);

  const sightingMarkers = focusedSighting
    ? [
        {
          id: focusedSighting.id,
          lat: Number(focusedSighting.latitude),
          lng: Number(focusedSighting.longitude),
        },
      ]
    : [];

  return { focusedSighting, sightingMarkers };
}
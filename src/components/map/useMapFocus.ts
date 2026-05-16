import { useCallback, useEffect, useState } from "react";
import { getPublicSightingById } from "../../lib/sightings";
import { useVisibilitySyncRegister } from "../sync/VisibilitySyncProvider";

export function useMapFocus(focusSighting: string | null) {
  const [focusedSighting, setFocusedSighting] = useState<any>(null);

  const loadFocusSighting = useCallback(async () => {
    if (!focusSighting) {
      setFocusedSighting(null);
      return;
    }

    const data = await getPublicSightingById(focusSighting);
    setFocusedSighting(data);
  }, [focusSighting]);

  useEffect(() => {
    void loadFocusSighting();
  }, [loadFocusSighting]);

  useVisibilitySyncRegister(() => {
    void loadFocusSighting();
  }, [loadFocusSighting]);

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
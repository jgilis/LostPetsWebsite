import { useCallback, useEffect, useState } from "react";
import { getPublicSightingById, withExactCoordinates } from "../../lib/sightings";
import { useVisibilitySyncRegister } from "../sync/VisibilitySyncProvider";
import { useRealtimeResyncRegister } from "../sync/RealtimeResyncProvider";

export function useMapFocus(focusSighting: string | null) {
  const [focusedSighting, setFocusedSighting] = useState<any>(null);

  const loadFocusSighting = useCallback(async () => {
    if (!focusSighting) {
      setFocusedSighting(null);
      return;
    }

    const data = await getPublicSightingById(focusSighting);
    if (!data) {
      setFocusedSighting(null);
      return;
    }

    const [withLocation] = await withExactCoordinates([data]);
    setFocusedSighting(withLocation);
  }, [focusSighting]);

  useEffect(() => {
    void loadFocusSighting();
  }, [loadFocusSighting]);

  useVisibilitySyncRegister(() => {
    void loadFocusSighting();
  }, [loadFocusSighting]);

  useRealtimeResyncRegister(() => {
    void loadFocusSighting();
  }, [loadFocusSighting]);

  const sightingMarkers =
    focusedSighting?.latitude == null || focusedSighting?.longitude == null
      ? []
      : [
          {
            id: focusedSighting.id,
            lat: focusedSighting.latitude,
            lng: focusedSighting.longitude,
          },
        ];

  return { focusedSighting, sightingMarkers };
}
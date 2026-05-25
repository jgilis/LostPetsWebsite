"use client";

import { useEffect, useState } from "react";
import { getLocationFallback } from "@/src/lib/location/getLocationFallback";
import { reverseGeocode } from "@/src/lib/location/reverseGeocode";
import type { LocationLabel } from "@/src/lib/location/types";

type UseLocationLabelOptions = {
  enabled?: boolean;
};

export function useLocationLabel(
  latitude: number,
  longitude: number,
  options?: UseLocationLabelOptions,
): LocationLabel {
  const enabled = options?.enabled ?? true;

  const [label, setLabel] = useState<LocationLabel>(() =>
    getLocationFallback(latitude, longitude),
  );

  useEffect(() => {
    if (!enabled) return;

    setLabel(getLocationFallback(latitude, longitude));

    let cancelled = false;

    void reverseGeocode(latitude, longitude).then((primary) => {
      if (cancelled) return;
      setLabel({
        primary,
        source: "geocoded",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, enabled]);

  return label;
}

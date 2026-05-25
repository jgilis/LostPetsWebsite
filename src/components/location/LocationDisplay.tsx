"use client";

import { formatLocationLabel } from "@/src/lib/location/formatLocationLabel";
import { LOCATION_UNKNOWN_LABEL } from "@/src/lib/location/constants";
import type { LocationLabel } from "@/src/lib/location/types";
import { useLocationLabel } from "@/src/hooks/useLocationLabel";

type LocationDisplayProps = {
  label?: LocationLabel;
  latitude?: number;
  longitude?: number;
  onViewMap?: () => void;
};

export default function LocationDisplay({
  label: labelProp,
  latitude,
  longitude,
  onViewMap,
}: LocationDisplayProps) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const resolvedLabel = useLocationLabel(latitude ?? 0, longitude ?? 0, {
    enabled: hasCoords && !labelProp,
  });

  const label =
    labelProp ??
    (hasCoords
      ? resolvedLabel
      : {
          primary: LOCATION_UNKNOWN_LABEL,
          source: "fallback" as const,
        });

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{formatLocationLabel(label)}</span>
      {onViewMap ? (
        <button
          type="button"
          onClick={onViewMap}
          className="text-blue-400 hover:underline"
        >
          View on map
        </button>
      ) : null}
    </span>
  );
}

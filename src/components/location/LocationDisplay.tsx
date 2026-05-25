import { formatLocationLabel } from "@/src/lib/location/formatLocationLabel";
import type { LocationLabel } from "@/src/lib/location/types";

type LocationDisplayProps = {
  label: LocationLabel;
  onViewMap?: () => void;
};

export default function LocationDisplay({
  label,
  onViewMap,
}: LocationDisplayProps) {
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

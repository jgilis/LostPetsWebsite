import type { UseWalkingModeResult } from "@/src/hooks/useWalkingMode";
import type { Report } from "@/src/lib/reports";
import type { MapBoundsBox } from "@/src/lib/geo/reportInBounds";
import type {
  AnimalFilter,
  TypeFilter,
} from "../report/ReportFiltersBar";

export type MapMode = "default" | "admin-scoped";

export type DiscoverViewState = {
  bounds: MapBoundsBox | null;
  filteredReports: Report[];
  reports: Report[];
};

export type MapProps = {
  mode?: MapMode;
  reportId?: string;
  refreshKey?: number;
  typeFilter?: TypeFilter;
  animalFilter?: AnimalFilter;
  onTypeFilterChange?: (value: TypeFilter) => void;
  onAnimalFilterChange?: (value: AnimalFilter) => void;
  hideFilters?: boolean;
  walkingMode: UseWalkingModeResult;
  fillContainer?: boolean;
  selectedReportId?: string | null;
  onSelectedReportChange?: (id: string | null) => void;
  onDiscoverViewChange?: (view: DiscoverViewState) => void;
};

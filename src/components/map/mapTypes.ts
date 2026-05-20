import type {
  AnimalFilter,
  TypeFilter,
} from "../report/ReportFiltersBar";

export type MapMode = "default" | "admin-scoped";

export type MapProps = {
  mode?: MapMode;
  reportId?: string;
  refreshKey?: number;
  typeFilter?: TypeFilter;
  animalFilter?: AnimalFilter;
  onTypeFilterChange?: (value: TypeFilter) => void;
  onAnimalFilterChange?: (value: AnimalFilter) => void;
  hideFilters?: boolean;
};

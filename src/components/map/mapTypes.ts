export type MapMode = "default" | "admin-scoped";

export type MapProps = {
  mode?: MapMode;
  reportId?: string;
  refreshKey?: number;
};

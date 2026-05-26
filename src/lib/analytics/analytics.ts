export type AnalyticsEvent =
  | "report_created"
  | "sighting_created"
  | "report_viewed"
  | "nearby_viewed"
  | "walking_mode_enabled"
  | "walking_mode_disabled"
  | "report_resolved"
  | "map_focus_used";

export interface AnalyticsProvider {
  track(event: AnalyticsEvent, payload?: Record<string, unknown>): void;
}

let provider: AnalyticsProvider = {
  track: () => {},
};

export function setAnalyticsProvider(p: AnalyticsProvider) {
  provider = p;
}

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  provider.track(event, payload);
}

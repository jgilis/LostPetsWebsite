import type { AnalyticsEvent, AnalyticsProvider } from "./analytics";

export const browserAnalytics: AnalyticsProvider = {
  track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
    if (typeof window === "undefined") return;

    console.debug("[analytics]", event, payload ?? {});
  },
};

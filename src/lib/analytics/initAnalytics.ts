import { setAnalyticsProvider } from "./analytics";
import { browserAnalytics } from "./browserAnalytics";

export function initAnalytics() {
  if (typeof window === "undefined") return;
  setAnalyticsProvider(browserAnalytics);
}

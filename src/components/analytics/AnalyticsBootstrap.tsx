"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/src/lib/analytics/initAnalytics";

export function AnalyticsBootstrap() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import MapWrapper from "../src/components/map/MapWrapper";
import ReportForm from "../src/components/report/ReportForm";
import { useTranslation } from "@/src/i18n/I18nProvider";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<"map" | "report">("map");
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "report") {
      setTab("report");
    }
  }, []);

  const handleReportCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex justify-center">
      <div className="w-full max-w-6xl px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">{t("appTitle")}</h1>

        <div className="flex border-b border-gray-700 mb-8">
          <button
            onClick={() => setTab("map")}
            className={`flex-1 p-3 text-center transition ${
              tab === "map"
                ? "border-b-2 border-white font-semibold"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            🗺 {t("tabMap")}
          </button>

          <button
            onClick={() => setTab("report")}
            className={`flex-1 p-3 text-center transition ${
              tab === "report"
                ? "border-b-2 border-white font-semibold"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            ➕ {t("tabReport")}
          </button>
        </div>

        {tab === "map" && (
          <div className="w-full h-[65vh] rounded-lg border border-gray-700">
            <div className="w-full h-full rounded-lg">
              <MapWrapper refreshKey={refreshKey} />
            </div>
          </div>
        )}

        {tab === "report" && (
          <div className="w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {t("reportPageTitle")}
            </h2>

            <ReportForm
              onReportCreated={handleReportCreated}
              onViewMap={() => setTab("map")}
            />
          </div>
        )}
      </div>
    </main>
  );
}

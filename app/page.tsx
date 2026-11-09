"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DiscoverWorkspace from "../src/components/discover/DiscoverWorkspace";
import ReportForm from "../src/components/report/ReportForm";
import ReportsFeed from "../src/components/feed/ReportsFeed";
import ReportFiltersBar, {
  type AnimalFilter,
  type TypeFilter,
} from "../src/components/report/ReportFiltersBar";
import DiscoverDestinationNav from "../src/components/layout/DiscoverDestinationNav";
import WalkingModeExitBar from "../src/components/layout/WalkingModeExitBar";
import SessionControls from "../src/components/auth/SessionControls";
import NotificationNavLink from "../src/components/notifications/NotificationNavLink";
import { useWalkingMode } from "../src/hooks/useWalkingMode";
import { useDesktopLayout } from "../src/hooks/useDesktopLayout";
import {
  homeDestinationHref,
  parseHomeDestination,
} from "../src/lib/homeDestination";
import { useTranslation } from "@/src/i18n/I18nProvider";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [animalFilter, setAnimalFilter] = useState<AnimalFilter>("all");
  const walkingMode = useWalkingMode();
  const isDesktop = useDesktopLayout();
  const { t } = useTranslation();
  const destination = parseHomeDestination(
    searchParams.get("tab"),
    searchParams.get("focus"),
  );

  useEffect(() => {
    document.body.classList.toggle(
      "discover-fullbleed",
      destination === "discover",
    );
    return () => document.body.classList.remove("discover-fullbleed");
  }, [destination]);

  useEffect(() => {
    if (isDesktop && walkingMode.isWalkingModeEnabled) {
      walkingMode.stopWalkingMode();
    }
  }, [isDesktop, walkingMode.isWalkingModeEnabled, walkingMode.stopWalkingMode]);

  const handleReportCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  const showDiscover = destination === "discover";
  const walking = walkingMode.isWalkingModeEnabled;

  return (
    <main
      className={`home-main bg-gray-950 text-white ${
        showDiscover
          ? "flex h-dvh flex-col overflow-hidden"
          : "min-h-screen"
      }`}
    >
      <DiscoverDestinationNav destination={destination} />
      <WalkingModeExitBar
        visible={walking && !isDesktop}
        onExit={walkingMode.stopWalkingMode}
      />

      <div
        className={`home-page-inner mx-auto flex w-full flex-1 flex-col ${
          showDiscover
            ? "max-w-none min-h-0"
            : "max-w-6xl px-4 py-6"
        } ${walking && !isDesktop ? "pt-12" : "pt-0"} md:pt-12 pb-16 md:pb-0`}
      >
        {showDiscover ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-end gap-3 px-3 py-2 text-xs md:px-4">
            <NotificationNavLink />
            <SessionControls />
          </div>
          <div className="shrink-0 px-2 md:hidden">
            <ReportFiltersBar
              typeFilter={typeFilter}
              animalFilter={animalFilter}
              onTypeFilterChange={setTypeFilter}
              onAnimalFilterChange={setAnimalFilter}
            />
          </div>
          <DiscoverWorkspace
            refreshKey={refreshKey}
            typeFilter={typeFilter}
            animalFilter={animalFilter}
            onTypeFilterChange={setTypeFilter}
            onAnimalFilterChange={setAnimalFilter}
            walkingMode={walkingMode}
          />
        </div>
        ) : null}

        {destination === "activity" ? (
          <div className="w-full">
            <h1 className="mb-4 text-center text-2xl font-bold">
              {t("tabActivity")}
            </h1>
            <ReportFiltersBar
              typeFilter={typeFilter}
              animalFilter={animalFilter}
              onTypeFilterChange={setTypeFilter}
              onAnimalFilterChange={setAnimalFilter}
            />
            <ReportsFeed
              typeFilter={typeFilter}
              animalFilter={animalFilter}
              refreshKey={refreshKey}
            />
          </div>
        ) : null}

        {destination === "help" ? (
          <div className="w-full">
            <h1 className="mb-4 text-center text-xl font-semibold">
              {t("reportPageTitle")}
            </h1>
            <ReportForm
              onReportCreated={handleReportCreated}
              onViewMap={() =>
                router.replace(homeDestinationHref("discover"), { scroll: false })
              }
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-950 px-4 py-10 text-center text-gray-400">
          Loading…
        </main>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

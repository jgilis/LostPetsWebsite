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
import DiscoverMobileFilters from "../src/components/discover/DiscoverMobileFilters";
import { useWalkingMode } from "../src/hooks/useWalkingMode";
import { useDesktopLayout } from "../src/hooks/useDesktopLayout";
import { formatProximityDistance } from "../src/lib/geo/formatProximityDistance";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
        statusLabel={
          walking && walkingMode.hasActiveUserLocation
            ? `${walkingMode.sessionStats.elapsedLabel} · ${formatProximityDistance(walkingMode.sessionStats.distanceMeters)}`
            : walking
              ? t("discoverWalkingWaiting")
              : null
        }
      />

      <div
        className={`home-page-inner mx-auto flex w-full flex-1 flex-col ${
          showDiscover
            ? "max-w-none min-h-0"
            : "max-w-6xl px-4 py-6"
        } ${walking && !isDesktop ? "pt-[4.75rem]" : "pt-0"} md:pt-12 pb-16 md:pb-0`}
      >
        {showDiscover ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 px-2 py-1 pt-[max(0.25rem,env(safe-area-inset-top))] md:justify-end md:px-4 md:py-2 md:pt-2">
            <div className="md:hidden">
              <DiscoverMobileFilters
                typeFilter={typeFilter}
                animalFilter={animalFilter}
                onTypeFilterChange={setTypeFilter}
                onAnimalFilterChange={setAnimalFilter}
                open={filtersOpen}
                onOpen={() => setFiltersOpen(true)}
                onClose={() => setFiltersOpen(false)}
              />
            </div>
            <div className="ml-auto flex items-center gap-1 md:gap-3">
              <NotificationNavLink />
              <SessionControls />
            </div>
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

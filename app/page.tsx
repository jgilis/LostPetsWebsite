"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DiscoverWorkspace from "../src/components/discover/DiscoverWorkspace";
import ReportWorkspace from "../src/components/report/ReportWorkspace";
import ReportsFeed from "../src/components/feed/ReportsFeed";
import {
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
  parseReportTask,
} from "../src/lib/homeDestination";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { DiscoverViewState } from "../src/components/map/mapTypes";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [animalFilter, setAnimalFilter] = useState<AnimalFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [discoverView, setDiscoverView] = useState<DiscoverViewState>({
    bounds: null,
    filteredReports: [],
    reports: [],
  });
  const walkingMode = useWalkingMode();
  const isDesktop = useDesktopLayout();
  const { t } = useTranslation();
  const destination = parseHomeDestination(
    searchParams.get("tab"),
    searchParams.get("focus"),
  );
  const reportTask = parseReportTask(searchParams.get("task"));
  const showDiscover = destination === "discover";

  useEffect(() => {
    document.body.classList.add("discover-fullbleed");
    return () => document.body.classList.remove("discover-fullbleed");
  }, []);

  useEffect(() => {
    if (isDesktop && walkingMode.isWalkingModeEnabled) {
      walkingMode.stopWalkingMode();
    }
  }, [isDesktop, walkingMode.isWalkingModeEnabled, walkingMode.stopWalkingMode]);

  const handleReportCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  const walking = walkingMode.isWalkingModeEnabled;

  return (
    <main className="home-main flex h-dvh flex-col overflow-hidden bg-gray-950 text-white">
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
        className={`home-page-inner relative mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col ${
          walking && !isDesktop ? "pt-[4.75rem]" : "pt-0"
        } md:pt-12 pb-16 md:pb-0`}
      >
        <div
          className="relative flex min-h-0 flex-1 flex-col"
          inert={!showDiscover ? true : undefined}
          aria-hidden={!showDiscover}
        >
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
            onViewChange={setDiscoverView}
            detailsEnabled={showDiscover}
          />
        </div>

        {destination === "activity" ? (
          <div
            className={`absolute inset-0 z-[545] flex flex-col overflow-hidden bg-gray-950 px-3 pb-16 md:px-4 md:pb-6 ${
              walking && !isDesktop ? "pt-[4.75rem]" : "pt-3"
            } md:pt-12`}
          >
            <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
              <ReportsFeed
                animalFilter={animalFilter}
                reports={discoverView.reports}
                bounds={discoverView.bounds}
                loading={discoverView.bounds == null}
              />
            </div>
          </div>
        ) : null}

        {destination === "report" ? (
          <div
            className={`absolute inset-0 z-[545] overflow-y-auto bg-gray-950 px-4 py-6 pb-16 md:pb-6 ${
              walking && !isDesktop ? "pt-[4.75rem]" : "pt-6"
            } md:pt-24`}
          >
            <ReportWorkspace
              reports={discoverView.reports}
              bounds={discoverView.bounds}
              loading={discoverView.bounds == null}
              initialTask={reportTask}
              onReportCreated={handleReportCreated}
              onViewDiscover={() =>
                router.replace(homeDestinationHref("discover"), {
                  scroll: false,
                })
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

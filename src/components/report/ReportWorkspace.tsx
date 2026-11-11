"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReportForm from "./ReportForm";
import DiscoverReportCard from "@/src/components/discover/DiscoverReportCard";
import SightingModal from "@/src/components/sightings/SightingsModal";
import { homeDestinationHref } from "@/src/lib/homeDestination";
import { lostReportsInDiscoverCamera } from "@/src/lib/lostReportsInCamera";
import { readReportDraft } from "@/src/lib/reportDraft";
import type { MapBoundsBox } from "@/src/lib/geo/reportInBounds";
import type { Report } from "@/src/lib/reports";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { isOwner } from "@/src/lib/permissions";
import { useTranslation } from "@/src/i18n/I18nProvider";

type ReportTask = "lost" | "found" | "seen";

type ReportWorkspaceProps = {
  reports: Report[];
  bounds: MapBoundsBox | null;
  loading?: boolean;
  initialTask?: "lost" | "found" | null;
  onReportCreated?: () => void;
  onViewDiscover: () => void;
};

export default function ReportWorkspace({
  reports,
  bounds,
  loading = false,
  initialTask = null,
  onReportCreated,
  onViewDiscover,
}: ReportWorkspaceProps) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [task, setTask] = useState<ReportTask | null>(initialTask);
  const [seenReportId, setSeenReportId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTask(initialTask);
      return;
    }
    const draft = readReportDraft();
    if (draft?.type === "lost" || draft?.type === "found") {
      setTask(draft.type);
    }
  }, [initialTask]);

  const lostInArea = useMemo(() => {
    return lostReportsInDiscoverCamera(reports, bounds).filter(
      (report) => !isOwner(user?.id, report.owner_user_id),
    );
  }, [bounds, reports, user?.id]);

  const seenReport =
    lostInArea.find((report) => report.id === seenReportId) ?? null;

  const goChooser = () => {
    setTask(null);
    setSeenReportId(null);
  };

  if (task === "lost" || task === "found") {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <button
          type="button"
          onClick={goChooser}
          className="mb-4 inline-flex min-h-[44px] items-center text-sm text-gray-300 hover:text-white"
        >
          {t("reportBack")}
        </button>
        <ReportForm
          key={task}
          initialType={task}
          onReportCreated={onReportCreated}
          onViewMap={onViewDiscover}
        />
      </div>
    );
  }

  if (task === "seen") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col">
        <button
          type="button"
          onClick={goChooser}
          className="mb-2 inline-flex min-h-[44px] w-fit items-center text-sm text-gray-300 hover:text-white"
        >
          {t("reportBack")}
        </button>
        <h1 className="mb-4 text-lg font-semibold text-white">
          {t("reportSeenPickerTitle")}
        </h1>
        {loading || bounds == null ? (
          <p className="text-sm text-gray-400">{t("reportsLoading")}</p>
        ) : lostInArea.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-8 text-center">
            <p className="text-base font-medium text-gray-300">
              {t("reportSeenPickerEmpty")}
            </p>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              {t("reportSeenPickerEmptyHint")}
            </p>
            <Link
              href={homeDestinationHref("discover")}
              scroll={false}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-gray-600 bg-gray-900 px-4 text-sm font-medium text-gray-100 hover:border-gray-500"
            >
              {t("activityEmptyOpenDiscover")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {lostInArea.map((report) => (
              <li key={report.id}>
                <DiscoverReportCard
                  report={report}
                  selected={report.id === seenReportId}
                  onSelect={setSeenReportId}
                />
              </li>
            ))}
          </ul>
        )}
        {seenReport ? (
          <SightingModal
            lostReportId={seenReport.id}
            onClose={() => setSeenReportId(null)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
      <button
        type="button"
        onClick={() => setTask("lost")}
        className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-left text-base font-medium text-white hover:border-gray-500"
      >
        {t("reportChooserLost")}
      </button>
      <button
        type="button"
        onClick={() => setTask("found")}
        className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-left text-base font-medium text-white hover:border-gray-500"
      >
        {t("reportChooserFound")}
      </button>
      <button
        type="button"
        onClick={() => setTask("seen")}
        className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-left text-base font-medium text-white hover:border-gray-500"
      >
        {t("reportChooserSeen")}
      </button>
    </div>
  );
}

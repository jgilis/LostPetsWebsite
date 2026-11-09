"use client";

import { useEffect, useState } from "react";
import ReportDetailClient from "@/app/report/[id]/ReportDetailClient";
import type { Report } from "@/src/lib/reports";
import { flagReport } from "@/src/lib/flags";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { isOwner } from "@/src/lib/permissions";
import { useTranslation } from "@/src/i18n/I18nProvider";
import SightingModal from "@/src/components/sightings/SightingsModal";

type DiscoverDetailSheetProps = {
  report: Report;
  onClose: () => void;
};

export default function DiscoverDetailSheet({
  report,
  onClose,
}: DiscoverDetailSheetProps) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const reportIsOwner = isOwner(user?.id, report.owner_user_id);
  const [showSightingModal, setShowSightingModal] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="discover-detail-sheet absolute inset-0 z-[540] flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("discoverDetailClose")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discover-detail-title"
        className="relative z-10 flex max-h-[min(85dvh,calc(100%-4rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-gray-800 bg-gray-950 md:rounded-xl"
      >
        <div className="flex shrink-0 justify-end border-b border-gray-800 px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center px-3 text-sm text-gray-300 hover:text-white"
          >
            {t("discoverDetailClose")}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ReportDetailClient
            report={report}
            presentation="sheet"
            onClose={onClose}
          />
          <div className="flex flex-wrap gap-2 px-6 pb-6">
            {report.type === "lost" && !reportIsOwner ? (
              <button
                type="button"
                onClick={() => setShowSightingModal(true)}
                className="rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                I spotted this animal
              </button>
            ) : null}
            {!reportIsOwner ? (
              <button
                type="button"
                onClick={async () => {
                  const reason = prompt("Why are you reporting this post?");
                  if (!reason) return;
                  const ok = await flagReport(report.id, reason);
                  window.alert(
                    ok
                      ? "Report submitted. Thank you."
                      : "Failed to submit report.",
                  );
                }}
                className="rounded-md bg-red-800 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Report this post
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {showSightingModal ? (
        <SightingModal
          lostReportId={report.id}
          onClose={() => setShowSightingModal(false)}
        />
      ) : null}
    </div>
  );
}

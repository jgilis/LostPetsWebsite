"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReportDetailClient from "@/app/report/[id]/ReportDetailClient";
import type { Report } from "@/src/lib/reports";
import { useCurrentUser } from "@/src/hooks/useCurrentUser";
import { isOwner } from "@/src/lib/permissions";
import { useTranslation } from "@/src/i18n/I18nProvider";
import SightingModal from "@/src/components/sightings/SightingsModal";

type DiscoverDetailSheetProps = {
  report: Report;
  onClose: () => void;
  discoverHref?: string;
  onDiscoverNavigate?: () => void;
};

export default function DiscoverDetailSheet({
  report,
  onClose,
  discoverHref,
  onDiscoverNavigate,
}: DiscoverDetailSheetProps) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const reportIsOwner = isOwner(user?.id, report.owner_user_id);
  const [showSightingModal, setShowSightingModal] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.defaultPrevented) return;
      if (document.querySelectorAll('[role="dialog"][aria-modal="true"]').length > 1) {
        return;
      }
      onClose();
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
        className="relative z-10 flex max-h-[min(85dvh,calc(100%-4rem))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-lp-line bg-lp-paper md:rounded-2xl"
      >
        <div className="flex shrink-0 justify-end border-b border-lp-line px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center px-3 text-sm text-lp-ink-muted hover:text-lp-ink"
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
            {discoverHref ? (
              <Link
                href={discoverHref}
                scroll={false}
                onClick={onDiscoverNavigate}
                className="rounded-full bg-lp-sage px-3 py-2 text-sm font-medium text-white hover:bg-lp-sage-dark"
              >
                {t("activityViewOnDiscover")}
              </Link>
            ) : null}
            {report.type === "lost" && !reportIsOwner ? (
              <button
                type="button"
                onClick={() => setShowSightingModal(true)}
                className="rounded-full bg-lp-sage px-3 py-2 text-sm font-medium text-white hover:bg-lp-sage-dark"
              >
                I spotted this animal
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

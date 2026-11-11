"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdmin } from "../../src/hooks/useAdmin";
import AdminHeader from "../../src/components/admin/AdminHeader";
import {
  getAdminQueueCounts,
  type AdminQueueCounts,
} from "../../src/lib/adminQueue";
import { useTranslation } from "@/src/i18n/I18nProvider";

const zeroCounts: AdminQueueCounts = {
  pendingSightings: 0,
  flaggedReports: 0,
  outOfAreaReports: 0,
};

export default function AdminHome() {
  const { loading, isAdmin } = useAdmin();
  const { t } = useTranslation();
  const [counts, setCounts] = useState<AdminQueueCounts>(zeroCounts);
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    void getAdminQueueCounts().then((next) => {
      if (!cancelled) {
        setCounts(next);
        setCountsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (loading) {
    return <p className="p-8 text-gray-400">{t("adminCheckingAccess")}</p>;
  }

  if (!isAdmin) {
    return null;
  }

  const countLabel = countsLoading ? "…" : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader />

      <p className="mb-4 text-sm text-lp-ink-muted">{t("adminQueueHint")}</p>

      <nav className="flex flex-col gap-2">
        <Link
          href="/admin/sightings?filter=pending"
          className="rounded-lg border border-amber-800/70 bg-amber-950/30 px-4 py-3 text-gray-200 hover:border-amber-700 hover:bg-amber-950/50"
        >
          <span className="flex items-center justify-between gap-3">
            <span>{t("adminSightingsWaiting")}</span>
            <span className="font-mono text-lg font-semibold text-amber-200">
              {countLabel ?? counts.pendingSightings}
            </span>
          </span>
        </Link>
        <Link
          href="/admin/flags"
          className="rounded-lg border border-amber-800/70 bg-amber-950/30 px-4 py-3 text-gray-200 hover:border-amber-700 hover:bg-amber-950/50"
        >
          <span className="flex items-center justify-between gap-3">
            <span>{t("adminFlaggedReports")}</span>
            <span className="font-mono text-lg font-semibold text-amber-200">
              {countLabel ?? counts.flaggedReports}
            </span>
          </span>
        </Link>
        <Link
          href="/admin/reports?filter=out-of-area"
          className="rounded-lg border border-amber-800/70 bg-amber-950/30 px-4 py-3 text-gray-200 hover:border-amber-700 hover:bg-amber-950/50"
        >
          <span className="flex items-center justify-between gap-3">
            <span>{t("adminOutOfAreaReports")}</span>
            <span className="font-mono text-lg font-semibold text-amber-200">
              {countLabel ?? counts.outOfAreaReports}
            </span>
          </span>
        </Link>
      </nav>

      <nav className="mt-8 flex flex-col gap-2 border-t border-lp-line pt-6">
        <p className="mb-1 text-xs uppercase tracking-wide text-lp-ink-subtle">
          {t("adminAllLists")}
        </p>
        <Link
          href="/admin/reports"
          className="rounded-2xl border border-lp-line bg-lp-paper px-4 py-3 text-lp-ink hover:border-lp-line-strong hover:bg-lp-paper-muted"
        >
          {t("adminAllReports")}
        </Link>
        <Link
          href="/admin/sightings?filter=all"
          className="rounded-2xl border border-lp-line bg-lp-paper px-4 py-3 text-lp-ink hover:border-lp-line-strong hover:bg-lp-paper-muted"
        >
          {t("adminAllSightings")}
        </Link>
        <Link
          href="/admin/log"
          className="rounded-2xl border border-lp-line bg-lp-paper px-4 py-3 text-lp-ink hover:border-lp-line-strong hover:bg-lp-paper-muted"
        >
          {t("adminModerationLog")}
        </Link>
      </nav>
    </div>
  );
}

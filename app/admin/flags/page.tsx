"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../../../src/hooks/useAdmin";
import { useAdminReportsSync } from "../../../src/hooks/useAdminReportsSync";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import AdminReportRow from "../../../src/components/admin/AdminReportRow";
import type { AdminReport } from "../../../src/lib/adminReports";
import {
  getFlaggedReportsWithFlags,
  updateReportStatus,
} from "../../../src/lib/reports";
import type { AdminFlagRow, ReportStatus } from "../../../src/lib/reports";
import { useTranslation } from "@/src/i18n/I18nProvider";

type EnrichedFlag = AdminReport & {
  count: number;
  reasons: string[];
  latestReasons: string[];
  lastFlagged: string;
};

export default function AdminFlagsPage() {
  const { t } = useTranslation();
  const { loading: adminLoading, isAdmin } = useAdmin();
  const [flags, setFlags] = useState<EnrichedFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const {
      reports,
      flags: flagRows,
      error,
    } = await getFlaggedReportsWithFlags();

    if (error) {
      setLoadError(error);
      setFlags([]);
      setLoading(false);
      return;
    }

    const flagMap = new Map<string, AdminFlagRow[]>();

    (flagRows || []).forEach((f) => {
      if (!flagMap.has(f.report_id)) {
        flagMap.set(f.report_id, []);
      }
      flagMap.get(f.report_id)!.push(f);
    });

    const enriched: EnrichedFlag[] = (reports || [])
      .filter((r) => r.status === "active" || r.status === "flagged")
      .map((r) => {
        const related = flagMap.get(r.id) || [];

        const reasons = related
          .map((f) =>
            typeof f.reason === "string" ? f.reason.trim() : null,
          )
          .filter((reason): reason is string => reason !== null && reason.length > 0);

        return {
          ...(r as AdminReport),
          count: related.length,
          reasons,
          latestReasons: reasons.slice(0, 5),
          lastFlagged: related[0]?.created_at || "",
        };
      });

    enriched.sort(
      (a, b) => Date.parse(b.lastFlagged || "") - Date.parse(a.lastFlagged || ""),
    );

    setFlags(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchFlags();
  }, [fetchFlags]);

  useAdminReportsSync(() => {
    void fetchFlags();
  });

  const handleStatusChange = useCallback(
    async (reportId: string, status: ReportStatus) => {
      const ok = await updateReportStatus(reportId, status);
      if (!ok) return false;

      if (status === "resolved" || status === "removed" || status === "expired") {
        setFlags((prev) => prev.filter((report) => report.id !== reportId));
      } else {
        setFlags((prev) =>
          prev.map((report) =>
            report.id === reportId ? { ...report, status } : report,
          ),
        );
      }

      return true;
    },
    [],
  );

  if (adminLoading) {
    return <p className="p-8 text-gray-400">{t("adminCheckingAccess")}</p>;
  }

  if (!isAdmin) return null;

  if (loading) {
    return <p className="p-8 text-gray-400">{t("adminLoadingReports")}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader title={t("adminFlaggedReports")} showBackLink />

      {loadError && (
        <p className="mb-4 text-red-300">{t("adminFlagsLoadFailed")}</p>
      )}

      {!loadError && flags.length === 0 && (
        <p className="text-gray-400">{t("adminNoFlagged")}</p>
      )}

      <div className="flex flex-col gap-4">
        {flags.map((report) => (
          <AdminReportRow
            key={report.id}
            report={report}
            onStatusChange={handleStatusChange}
            showRestoreActions
            flagExtras={{
              count: report.count,
              latestReasons: report.latestReasons,
              lastFlagged: report.lastFlagged,
            }}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "../../../src/hooks/useAdmin";
import { useAdminReportsSync } from "../../../src/hooks/useAdminReportsSync";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import AdminReportRow from "../../../src/components/admin/AdminReportRow";
import type { AdminReport } from "../../../src/lib/adminReports";
import { getAllReports, updateReportStatus } from "../../../src/lib/reports";
import type { ReportStatus } from "../../../src/lib/reports";
import { isReportOutOfMechelen } from "../../../src/lib/mechelenBounds";
import { findPossibleDuplicates } from "../../../src/lib/duplicateHint";
import { useTranslation } from "@/src/i18n/I18nProvider";

function AdminAllReportsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const outOfAreaOnly = searchParams.get("filter") === "out-of-area";
  const { loading: adminLoading, isAdmin } = useAdmin();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    const data = await getAllReports();
    setReports(data as AdminReport[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useAdminReportsSync(() => {
    void loadReports();
  });

  const handleStatusChange = useCallback(
    async (reportId: string, status: ReportStatus) => {
      const ok = await updateReportStatus(reportId, status);
      if (!ok) return false;

      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status } : report,
        ),
      );
      return true;
    },
    [],
  );

  if (adminLoading) {
    return <p className="p-8 text-gray-400">{t("adminCheckingAccess")}</p>;
  }

  if (!isAdmin) return null;

  const visibleReports = useMemo(() => {
    if (!outOfAreaOnly) return reports;
    return reports.filter(
      (report) =>
        report.status === "active" &&
        isReportOutOfMechelen(report.latitude, report.longitude),
    );
  }, [outOfAreaOnly, reports]);

  const duplicateIdsByReport = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const report of visibleReports) {
      if (report.latitude == null || report.longitude == null) continue;
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const matches = findPossibleDuplicates(reports, {
        animalType: report.animal_type,
        latitude: lat,
        longitude: lng,
        excludeId: report.id,
      });
      if (matches.length > 0) {
        map.set(
          report.id,
          matches.map((match) => match.id),
        );
      }
    }
    return map;
  }, [reports, visibleReports]);

  if (loading) {
    return <p className="p-8 text-gray-400">{t("adminLoadingReports")}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader
        title={
          outOfAreaOnly ? t("adminOutOfAreaReports") : t("adminAllReports")
        }
        showBackLink
      />

      {visibleReports.length === 0 && (
        <p className="text-gray-400">
          {outOfAreaOnly ? t("adminNoOutOfArea") : t("adminNoReports")}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {visibleReports.map((report) => (
          <AdminReportRow
            key={report.id}
            report={report}
            onStatusChange={handleStatusChange}
            duplicateIds={duplicateIdsByReport.get(report.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminAllReportsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-400">Loading...</p>}>
      <AdminAllReportsContent />
    </Suspense>
  );
}

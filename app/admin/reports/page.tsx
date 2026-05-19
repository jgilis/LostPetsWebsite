"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "../../../src/hooks/useAdmin";
import { useAdminReportsSync } from "../../../src/hooks/useAdminReportsSync";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import AdminReportRow from "../../../src/components/admin/AdminReportRow";
import type { AdminReport } from "../../../src/lib/adminReports";
import { getAllReports, updateReportStatus } from "../../../src/lib/reports";
import type { ReportStatus } from "../../../src/lib/reports";
import { useTranslation } from "@/src/i18n/I18nProvider";

export default function AdminAllReportsPage() {
  const { t } = useTranslation();
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

  if (loading) {
    return <p className="p-8 text-gray-400">{t("adminLoadingReports")}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader title={t("adminAllReports")} showBackLink />

      {reports.length === 0 && (
        <p className="text-gray-400">{t("adminNoReports")}</p>
      )}

      <div className="flex flex-col gap-4">
        {reports.map((report) => (
          <AdminReportRow
            key={report.id}
            report={report}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

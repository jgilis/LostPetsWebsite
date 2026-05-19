"use client";

import Link from "next/link";
import { useAdmin } from "../../src/hooks/useAdmin";
import AdminHeader from "../../src/components/admin/AdminHeader";
import { useTranslation } from "@/src/i18n/I18nProvider";

export default function AdminHome() {
  const { loading, isAdmin } = useAdmin();
  const { t } = useTranslation();

  if (loading) {
    return <p className="p-8 text-gray-400">{t("adminCheckingAccess")}</p>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader />

      <nav className="flex flex-col gap-2">
        <Link
          href="/admin/reports"
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
        >
          {t("adminAllReports")}
        </Link>
        <Link
          href="/admin/flags"
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
        >
          {t("adminFlaggedReports")}
        </Link>
        <Link
          href="/admin/sightings"
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 hover:border-gray-600 hover:bg-gray-800"
        >
          {t("adminAllSightings")}
        </Link>
      </nav>
    </div>
  );
}

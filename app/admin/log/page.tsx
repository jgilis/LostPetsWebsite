"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../../../src/hooks/useAdmin";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import { getModerationActions } from "../../../src/lib/adminQueue";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

type LogRow = {
  id: string;
  actor_id: string;
  target_type: string;
  target_id: string;
  action: string;
  created_at: string;
};

function actionKey(action: string): TranslationKey {
  switch (action) {
    case "approve":
      return "adminLogApprove";
    case "reject":
      return "adminLogReject";
    case "hide":
      return "adminLogHide";
    case "restore":
      return "adminLogRestore";
    case "resolve":
      return "adminLogResolve";
    default:
      return "adminLogUnknown";
  }
}

function targetKey(targetType: string): TranslationKey {
  return targetType === "sighting" ? "adminLogSighting" : "adminLogReport";
}

export default function AdminModerationLogPage() {
  const { t } = useTranslation();
  const { loading: adminLoading, isAdmin } = useAdmin();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getModerationActions().then((data) => {
      setRows(data as LogRow[]);
      setLoading(false);
    });
  }, []);

  if (adminLoading) {
    return <p className="p-8 text-gray-400">{t("adminCheckingAccess")}</p>;
  }

  if (!isAdmin) return null;

  if (loading) {
    return <p className="p-8 text-gray-400">{t("adminLoadingLog")}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader title={t("adminModerationLog")} showBackLink />

      {rows.length === 0 && (
        <p className="text-gray-400">{t("adminNoLog")}</p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-lp-line bg-lp-paper px-4 py-3 text-sm text-lp-ink"
          >
            <p className="font-medium">
              {t(actionKey(row.action))} · {t(targetKey(row.target_type))}
            </p>
            <p className="mt-1 font-mono text-xs text-gray-500">
              {row.target_id}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {new Date(row.created_at).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

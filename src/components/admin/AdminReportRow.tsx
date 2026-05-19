"use client";

import {
  formatReportLocation,
  formatReportTimestamp,
  truncateText,
  type AdminReport,
} from "@/src/lib/adminReports";
import type { ReportStatus } from "@/src/lib/reports";
import { isReportOutOfMechelen } from "@/src/lib/mechelenBounds";
import AdminReportThumbnail from "./AdminReportThumbnail";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

function statusTranslationKey(status: string): TranslationKey {
  switch (status) {
    case "removed":
      return "statusHidden";
    case "flagged":
      return "statusFlagged";
    case "resolved":
      return "statusResolved";
    case "expired":
      return "statusExpired";
    default:
      return "statusActive";
  }
}

type AdminReportRowProps = {
  report: AdminReport;
  onStatusChange: (reportId: string, status: ReportStatus) => Promise<boolean>;
  flagExtras?: {
    count: number;
    latestReasons: string[];
    lastFlagged: string;
  };
  showRestoreActions?: boolean;
};

const actionButtonClass =
  "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-50";

export default function AdminReportRow({
  report,
  onStatusChange,
  flagExtras,
  showRestoreActions = false,
}: AdminReportRowProps) {
  const { t } = useTranslation();
  const description = report.description?.trim() || t("adminNoDescription");
  const location = formatReportLocation(report.latitude, report.longitude);
  const reportedAt = formatReportTimestamp(report);
  const statusLabel = t(statusTranslationKey(report.status));
  const outOfArea = isReportOutOfMechelen(report.latitude, report.longitude);

  const handleRemove = async () => {
    if (!window.confirm(t("adminRemoveConfirm"))) {
      return;
    }

    await onStatusChange(report.id, "removed");
  };

  return (
    <article
      className={`rounded-lg border p-4 text-gray-200 ${
        outOfArea
          ? "border-red-700/80 bg-red-950/35"
          : "border-gray-700 bg-gray-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold capitalize">
            {report.animal_type}
            {report.type ? (
              <span className="font-normal text-gray-400"> · {report.type}</span>
            ) : null}
            {outOfArea ? (
              <span
                className="ml-2 text-sm font-normal text-amber-300"
                title="Coordinates outside the usual Mechelen area"
              >
                ⚠ {t("adminOutOfArea")}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-sm">
            {t("adminStatus")}{" "}
            <span className="capitalize text-gray-300">{statusLabel}</span>
          </p>
        </div>
        {report.photo_url ? (
          <AdminReportThumbnail
            src={report.photo_url}
            alt={report.animal_type}
          />
        ) : null}
      </div>

      <p className="mt-2 text-sm text-gray-300">
        {truncateText(description)}
      </p>

      <dl className="mt-3 space-y-1 text-xs text-gray-400">
        {location && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500">{t("adminLocation")}</dt>
            <dd className={outOfArea ? "text-amber-200" : undefined}>
              {location}
              {outOfArea ? " ⚠" : null}
            </dd>
          </div>
        )}
        {reportedAt && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500">{t("adminReported")}</dt>
            <dd>{reportedAt}</dd>
          </div>
        )}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-gray-500">ID</dt>
          <dd className="font-mono text-[11px] text-gray-500">{report.id}</dd>
        </div>
      </dl>

      {flagExtras && (
        <div className="mt-3 border-t border-gray-800 pt-3 text-sm">
          <p className="text-amber-200/90">
            {flagExtras.count}{" "}
            {flagExtras.count === 1 ? t("adminFlags") : t("adminFlagsPlural")}
          </p>
          {flagExtras.latestReasons.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-gray-400">
              {flagExtras.latestReasons.map((reason, index) => (
                <li key={`${report.id}-reason-${index}`}>{reason}</li>
              ))}
            </ul>
          )}
          {flagExtras.lastFlagged && (
            <p className="mt-1 text-xs text-gray-500">
              {t("adminLastFlagged")}{" "}
              {new Date(flagExtras.lastFlagged).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-800 pt-3">
        <button
          type="button"
          onClick={() => void onStatusChange(report.id, "resolved")}
          className={`${actionButtonClass} border-emerald-800/60 text-emerald-200 hover:bg-emerald-950/40`}
        >
          {t("adminResolve")}
        </button>

        <button
          type="button"
          onClick={() => void handleRemove()}
          className={`${actionButtonClass} border-red-800 bg-red-950/50 text-red-200 hover:bg-red-950`}
        >
          {t("adminRemove")}
        </button>

        {showRestoreActions && (
          <>
            <button
              type="button"
              onClick={() => void onStatusChange(report.id, "active")}
              className={`${actionButtonClass} border-gray-600 hover:bg-gray-800`}
            >
              {t("adminRestore")}
            </button>
            <button
              type="button"
              onClick={() => void onStatusChange(report.id, "flagged")}
              className={`${actionButtonClass} border-amber-700/60 text-amber-200 hover:bg-amber-950/40`}
            >
              {t("adminKeepFlagged")}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

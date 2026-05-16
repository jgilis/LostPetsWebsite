"use client";

import {
  formatAdminReportStatus,
  formatReportLocation,
  formatReportTimestamp,
  truncateText,
  type AdminReport,
} from "@/src/lib/adminReports";
import type { ReportStatus } from "@/src/lib/reports";
import AdminReportThumbnail from "./AdminReportThumbnail";

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
  const description = report.description?.trim() || "No description";
  const location = formatReportLocation(report.latitude, report.longitude);
  const reportedAt = formatReportTimestamp(report);
  const statusLabel = formatAdminReportStatus(report.status);

  const handleRemove = async () => {
    if (
      !window.confirm(
        "Remove this report from the public map? The record will be kept for admin audit.",
      )
    ) {
      return;
    }

    await onStatusChange(report.id, "removed");
  };

  return (
    <article className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-200">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold capitalize">
            {report.animal_type}
            {report.type ? (
              <span className="font-normal text-gray-400"> · {report.type}</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-sm">
            Status:{" "}
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
            <dt className="text-gray-500">Location</dt>
            <dd>{location}</dd>
          </div>
        )}
        {reportedAt && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-gray-500">Reported</dt>
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
            {flagExtras.count} flag{flagExtras.count === 1 ? "" : "s"}
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
              Last flagged: {new Date(flagExtras.lastFlagged).toLocaleString()}
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
          Resolve
        </button>

        <button
          type="button"
          onClick={() => void handleRemove()}
          className={`${actionButtonClass} border-red-800 bg-red-950/50 text-red-200 hover:bg-red-950`}
        >
          Remove
        </button>

        {showRestoreActions && (
          <>
            <button
              type="button"
              onClick={() => void onStatusChange(report.id, "active")}
              className={`${actionButtonClass} border-gray-600 hover:bg-gray-800`}
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => void onStatusChange(report.id, "flagged")}
              className={`${actionButtonClass} border-amber-700/60 text-amber-200 hover:bg-amber-950/40`}
            >
              Keep flagged
            </button>
          </>
        )}
      </div>
    </article>
  );
}

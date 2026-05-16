"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../../../src/hooks/useAdmin";
import AdminHeader from "../../../src/components/admin/AdminHeader";
import {
  getFlaggedReportsWithFlags,
  updateReportStatus,
} from "../../../src/lib/reports";

type Report = {
  id: string;
  status: "active" | "flagged" | "removed" | "resolved" | "expired";
  type: "lost" | "found";
  animal_type: string;
  animal_name?: string | null;
  description?: string | null;
};

type FlagRow = {
  id: string;
  report_id: string;
  reason: string | null;
  created_at: string;
};

type EnrichedFlag = Report & {
  count: number;
  reasons: string[];
  latestReasons: string[];
  lastFlagged: string;
};

export default function AdminFlagsPage() {
  const { loading: adminLoading, isAdmin } = useAdmin();

  const [flags, setFlags] = useState<EnrichedFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    setLoading(true);

    const { reports, flags } =
      await getFlaggedReportsWithFlags();

    const flagMap = new Map<string, FlagRow[]>();

    (flags || []).forEach((f) => {
      if (!flagMap.has(f.report_id)) {
        flagMap.set(f.report_id, []);
      }
      flagMap.get(f.report_id)!.push(f);
    });

    const enriched: EnrichedFlag[] = (reports || []).map((r) => {
      const related = flagMap.get(r.id) || [];

      const reasons = related
        .map((f) =>
          typeof f.reason === "string" ? f.reason.trim() : null
        )
        .filter((r): r is string => r !== null && r.length > 0);

      return {
        ...r,
        count: related.length,
        reasons,
        latestReasons: reasons.slice(0, 5),
        lastFlagged: related[0]?.created_at || "",
      };
    });

    setFlags(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  if (adminLoading) return <p className="p-8 text-gray-400">Checking access...</p>;
  if (!isAdmin) return null;

  const setStatus = async (
    reportId: string,
    status: EnrichedFlag["status"]
  ) => {
    const ok = await updateReportStatus(reportId, status);

    if (!ok) return;

    fetchFlags();
  };

  if (loading) return <p className="p-8 text-gray-400">Loading reports...</p>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <AdminHeader title="Flagged Reports" showBackLink />

      {flags.length === 0 && (
        <p className="text-gray-400">No flagged reports.</p>
      )}

      <div className="flex flex-col gap-4">
        {flags.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-200"
          >
            <p><strong>ID:</strong> {r.id}</p>
            <p><strong>Status:</strong> {r.status}</p>
            <p><strong>Type:</strong> {r.type}</p>
            <p><strong>Animal:</strong> {r.animal_type}</p>
            <p><strong>Description:</strong> {r.description || "N/A"}</p>

            <p><strong>⚠️ Flag count:</strong> {r.count}</p>

            <p><strong>🧾 Last 5 reasons:</strong></p>
            <ul>
              {r.latestReasons.length === 0 && (
                <li>No reasons provided</li>
              )}
              {r.latestReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>

            <p className="text-xs text-gray-500">
              Last flagged:{" "}
              {r.lastFlagged
                ? new Date(r.lastFlagged).toLocaleString()
                : "N/A"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-800 pt-3">
              <button
                type="button"
                onClick={() => void setStatus(r.id, "active")}
                className="rounded-md border border-gray-600 px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                Restore
              </button>

              <button
                type="button"
                onClick={() => void setStatus(r.id, "flagged")}
                className="rounded-md border border-amber-700/60 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-950/40"
              >
                Keep flagged
              </button>

              <button
                type="button"
                onClick={() => void setStatus(r.id, "removed")}
                className="rounded-md border border-red-800 bg-red-950/50 px-3 py-1.5 text-sm text-red-200 hover:bg-red-950"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
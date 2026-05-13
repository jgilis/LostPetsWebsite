"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../../../src/hooks/useAdmin";
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

  if (adminLoading) return <p>Checking access...</p>;
  if (!isAdmin) return null;

  const setStatus = async (
    reportId: string,
    status: EnrichedFlag["status"]
  ) => {
    const ok = await updateReportStatus(reportId, status);

    if (!ok) return;

    fetchFlags();
  };

  if (loading) return <p>Loading reports...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🚨 Flagged Posts</h1>

      {flags.length === 0 && <p>No flagged reports 🎉</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {flags.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
            }}
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

            <p style={{ fontSize: "12px", color: "#666" }}>
              Last flagged:{" "}
              {r.lastFlagged
                ? new Date(r.lastFlagged).toLocaleString()
                : "N/A"}
            </p>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setStatus(r.id, "active")}>
                ✅ Restore
              </button>

              <button onClick={() => setStatus(r.id, "flagged")}>
                ⚠️ Keep flagged
              </button>

              <button
                onClick={() => setStatus(r.id, "removed")}
                style={{ background: "red", color: "white" }}
              >
                ❌ Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
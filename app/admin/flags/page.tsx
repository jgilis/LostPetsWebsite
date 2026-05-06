"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";
import { useAdmin } from "../../../src/hooks/useAdmin";

type Report = {
  id: string;
  status: "active" | "flagged" | "removed" | "resolved" | "expired";
  type: "lost" | "found";
  animal_type: "dog" | "cat" | "bird" | "rodent" | "other";
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

  // 1. get flagged reports (source of truth)
  const { data: reports, error: reportError } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "flagged");

  console.log("📌 REPORTS (flagged):", reports); // 👈 ADD THIS

  if (reportError) {
    console.error(reportError.message);
    setLoading(false);
    return;
  }

  // 2. get all flags
  const { data: flagsData, error: flagError } = await supabase
    .from("reports_flags")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("📌 FLAGS RAW:", flagsData); // 👈 ADD THIS

  if (flagError) {
    console.error(flagError.message);
    setLoading(false);
    return;
  }

  const flagMap = new Map<string, FlagRow[]>();

    (flagsData || []).forEach((f) => {
      if (!flagMap.has(f.report_id)) {
        flagMap.set(f.report_id, []);
      }
      flagMap.get(f.report_id)!.push(f);
    });

    console.log("📌 FLAG MAP KEYS:", Array.from(flagMap.keys())); // 👈 ADD THIS

    const enriched: EnrichedFlag[] = (reports || []).map((r) => {
      const related = flagMap.get(r.id) || [];

      const reasons = related
        .map((f) => (typeof f.reason === "string" ? f.reason.trim() : null))
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

  if (adminLoading) {
    return <p>Checking access...</p>;
  }

  if (!isAdmin) {
    return null;
  }

  const setStatus = async (reportId: string, status: EnrichedFlag["status"]) => {
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);

    if (error) {
      console.error(error.message);
      return;
    }

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
            {/* BASIC INFO */}
            <p><strong>ID:</strong> {r.id}</p>
            <p><strong>Status:</strong> {r.status}</p>
            <p><strong>Type:</strong> {r.type}</p>
            <p><strong>Animal:</strong> {r.animal_type}</p>
            <p><strong>Description:</strong> {r.description || "N/A"}</p>

            {/* FLAGS */}
            <p>
              <strong>⚠️ Flag count:</strong> {r.count}
            </p>

            <p><strong>🧾 Last 5 reasons:</strong></p>
            <ul>
              {r.latestReasons.length === 0 && <li>No reasons provided</li>}
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

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
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
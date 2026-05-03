"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";

type ReportFlag = {
  id: string;
  report_id: string;
  reason: string | null;
  created_at: string;
  status: string;
};

export default function AdminReportsPage() {
  const [flags, setFlags] = useState<ReportFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("report_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error.message);
      setLoading(false);
      return;
    }

    setFlags(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const markReviewed = async (id: string) => {
    const { error } = await supabase
      .from("report_flags")
      .update({ status: "reviewed" })
      .eq("id", id);

    if (error) {
      console.error(error.message);
      return;
    }

    setFlags((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "reviewed" } : f
      )
    );
  };

  const deleteReport = async (report_id: string) => {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", report_id);

    if (error) {
      console.error(error.message);
      return;
    }

    alert("Report deleted");
  };

  if (loading) return <p>Loading reports...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🚨 Reported Posts</h1>

      {flags.length === 0 && <p>No reports 🎉</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {flags.map((f) => (
          <div
            key={f.id}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <p><strong>Report ID:</strong> {f.report_id}</p>
            <p><strong>Reason:</strong> {f.reason || "N/A"}</p>
            <p><strong>Status:</strong> {f.status}</p>
            <p style={{ fontSize: "12px", color: "#666" }}>
              {new Date(f.created_at).toLocaleString()}
            </p>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => markReviewed(f.id)}
              >
                Mark reviewed
              </button>

              <button
                onClick={() => deleteReport(f.report_id)}
                style={{ background: "red", color: "white" }}
              >
                Delete post
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
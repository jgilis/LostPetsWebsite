"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../../src/hooks/useCurrentUser";
import { supabase } from "../../src/lib/supabase";

type Report = {
  id: string;
  type: string;
  animal_type: string;
  description: string;
  owner_user_id: string | null;
};

export default function EditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get("id");
  const { userId, loading: authLoading } = useCurrentUser();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setLoading(false);
      return;
    }

    if (!reportId) {
      setLoading(false);
      setMessage("Missing report id.");
      return;
    }

    let active = true;

    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, type, animal_type, description, owner_user_id")
        .eq("id", reportId)
        .single();

      if (!active) return;

      if (error || !data) {
        setMessage("Report not found.");
        setReport(null);
      } else if (data.owner_user_id !== userId) {
        setMessage("You do not have permission to manage this report.");
        setReport(null);
      } else {
        setReport(data);
        setMessage("");
      }

      setLoading(false);
    };

    void fetchReport();

    return () => {
      active = false;
    };
  }, [authLoading, userId, reportId]);

  const handleDelete = async () => {
    if (!report || !userId || report.owner_user_id !== userId) return;

    if (!window.confirm("Delete this report permanently?")) return;

    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", report.id)
      .eq("owner_user_id", userId);

    if (error) {
      setMessage("Delete failed.");
      return;
    }

    setMessage("Report deleted.");
    router.push("/");
  };

  if (authLoading || loading) {
    return <p style={{ padding: "1rem" }}>Loading...</p>;
  }

  if (!userId) {
    return (
      <div style={{ padding: "1rem", maxWidth: "480px" }}>
        <h1>Edit / Delete Report</h1>
        <p style={{ marginTop: "12px" }}>
          Please log in to manage your reports.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            marginTop: "12px",
            color: "#60a5fa",
            fontWeight: 600,
          }}
        >
          Log in
        </Link>
      </div>
    );
  }

  if (!reportId || !report) {
    return (
      <div style={{ padding: "1rem" }}>
        <h1>Edit / Delete Report</h1>
        <p style={{ marginTop: "12px" }}>{message || "Report not available."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "560px" }}>
      <h1>Edit / Delete Report</h1>

      <p style={{ marginTop: "12px" }}>
        <strong>Type:</strong> {report.type}
      </p>
      <p>
        <strong>Animal:</strong> {report.animal_type}
      </p>
      <p>
        <strong>Description:</strong> {report.description}
      </p>

      <button
        type="button"
        onClick={() => void handleDelete()}
        style={{
          marginTop: "16px",
          padding: "8px 14px",
          background: "#dc2626",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Delete report
      </button>

      {message && <p style={{ marginTop: "12px" }}>{message}</p>}
    </div>
  );
}

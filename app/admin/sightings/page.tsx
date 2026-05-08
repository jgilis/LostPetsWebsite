"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Sighting = {
  id: string;
  lost_report_id: string;
  latitude: number;
  longitude: number;
  description: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
};

export default function AdminSightingsPage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("sightings")
        .select("*")
        .order("created_at", { ascending: false });

      setSightings(data || []);
      setLoading(false);
    }

    load();
  }, []);

  async function updateStatus(
    id: string,
    status: string
  ) {
    const { error } = await supabase
      .from("sightings")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Failed to update status");
      return;
    }

    setSightings((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status }
          : s
      )
    );
  }

  if (loading) return <p>Loading sightings...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🐾 Sightings Admin</h1>

      {sightings.length === 0 && <p>No sightings yet.</p>}

      {sightings.map((s) => (
        <div
          key={s.id}
          style={{
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <p>
            📍 {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}
          </p>

          <p>📝 {s.description || "No description"}</p>

          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color:
                s.status === "pending"
                  ? "#f59e0b"
                  : s.status === "approved"
                  ? "#10b981"
                  : "#6b7280",
            }}
          >
            {s.status === "pending" && "🟡 Pending review"}
            {s.status === "approved" && "🟢 Approved"}
            {s.status === "rejected" && "🔴 Rejected"}
            {s.status === "removed" && "⚫ Removed"}
          </p>

          <a
            href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "8px",
              color: "#2563eb",
              textDecoration: "underline",
            }}
          >
            Open in Maps
          </a>
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <button
              onClick={() => updateStatus(s.id, "approved")}
              style={{
                padding: "6px 10px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Approve
            </button>

            <button
              onClick={() => updateStatus(s.id, "rejected")}
              style={{
                padding: "6px 10px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


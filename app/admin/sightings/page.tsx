"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../src/lib/supabase";

type ReportRef = {
  id: string;
  latitude: number;
  longitude: number;
  animal_type: string;
  animal_name: string | null;
  owner_user_id: string | null;
};

type Sighting = {
  id: string;
  lost_report_id: string;
  latitude: number;
  longitude: number;
  description: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;

  // optional joined data
  reports?: ReportRef;
};

// 🧠 distance helper (unchanged logic, admin-only use)
function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function AdminSightingsPage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("sightings")
        .select(`
          *,
          reports:lost_report_id (
            id,
            latitude,
            longitude,
            animal_type,
            animal_name,
            owner_user_id
          )
        `)
        .order("created_at", { ascending: false });

      setSightings((data as Sighting[]) || []);
      setLoading(false);
    }

    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("sightings")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Failed to update status");
      return;
    }

    // 🧠 NEW: fetch sighting for event payload
    const { data: sighting } = await supabase
      .from("sightings")
      .select("*")
      .eq("id", id)
      .single();

    if (sighting) {
      await supabase.from("notification_events").insert({
        type:
          status === "approved"
            ? "sighting_approved"
            : status === "rejected"
            ? "sighting_rejected"
            : "sighting_updated",

        target_user_id: sighting.reports?.owner_user_id || null,

        payload: {
          sighting_id: id,
          lost_report_id: sighting.lost_report_id,
          latitude: sighting.latitude,
          longitude: sighting.longitude,
          status,
        },
      });
    }

    setSightings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
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

          {/* 🧠 LOST REPORT CONTEXT */}
          {s.reports && (
            <>
              <p>
                🐾 {s.reports.animal_type}{" "}
                {s.reports.animal_name
                  ? `(${s.reports.animal_name})`
                  : ""}
              </p>

              <p>
                📏 Distance from last known location:{" "}
                {getDistanceMeters(
                  s.reports.latitude,
                  s.reports.longitude,
                  s.latitude,
                  s.longitude
                ).toFixed(0)}
              </p>
            </>
          )}

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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "10px",
            }}
          >
            {/* PRIMARY */}
            <a
              href={`/?focusSighting=${s.id}&focusReport=${s.lost_report_id}`}
              style={{
                color: "#2563eb",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              View on platform map
            </a>

            {/* SECONDARY */}
            <a
              href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#666",
                fontSize: "14px",
                textDecoration: "underline",
              }}
            >
              Open in Google Maps
            </a>
          </div>

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
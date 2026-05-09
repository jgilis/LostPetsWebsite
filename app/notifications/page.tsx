"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getOwnerToken } from "../../src/lib/owner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type NotificationEvent = {
  id: string;
  type: string;
  payload: {
    sighting_id?: string;
    lost_report_id?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
  };
  created_at: string;
  read_at: string | null;
};

export default function NotificationsPage() {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const ownerToken = getOwnerToken();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("notification_events")
        .select("*")
        .eq("type", "sighting_approved")
        .eq("target_user_id", ownerToken)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      }

      setEvents((data as NotificationEvent[]) || []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading notifications...</p>;
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          marginBottom: "20px",
        }}
      >
        🔔 Notifications
      </h1>

      {events.length === 0 && (
        <p>No notifications yet.</p>
      )}

      {events.map((event) => (
        <div
          key={event.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "12px",
            background: "#fff",
          }}
        >
          <p
            style={{
              fontWeight: 600,
              color: "#444",
              marginBottom: "6px",
            }}
          >
            🐾 Potential sighting approved
          </p>

          <p style={{
            marginBottom: "6px",
            color: "#444",
           }}>
            A possible sighting of your lost pet was approved by moderation.
          </p>

          {event.payload.latitude &&
            event.payload.longitude && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "6px",
                }}
              >
                Approximate area:
                {" "}
                {event.payload.latitude.toFixed(3)},
                {" "}
                {event.payload.longitude.toFixed(3)}
              </p>
            )}

          <p
            style={{
              fontSize: "13px",
              color: "#666",
            }}
          >
            {new Date(
              event.created_at
            ).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
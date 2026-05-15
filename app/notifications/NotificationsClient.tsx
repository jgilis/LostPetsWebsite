"use client";

import { useEffect } from "react";
import { useNotifications } from "../../src/components/notifications/NotificationsProvider";

export default function NotificationsClient() {
  const { events, loading, loadNotifications } = useNotifications();

  useEffect(() => {
    void loadNotifications({ markRead: true });
  }, [loadNotifications]);

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

          {event.payload.sighting_id && (
            <a
              href={`/sightings/${event.payload.sighting_id}`}
              style={{
                display: "inline-block",
                marginTop: "10px",
                color: "#2563eb",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              View sighting →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

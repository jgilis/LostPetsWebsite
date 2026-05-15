"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type ConnectionStatus = "connecting" | "connected" | "error";

type RealtimeDebugProps = {
  onInsert?: () => void;
  hideUi?: boolean;
};

export function RealtimeDebug({ onInsert, hideUi = false }: RealtimeDebugProps) {
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-debug-notification-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_events",
        },
        (payload) => {
          console.log("[RealtimeDebug] notification_events INSERT:", payload);
          setLastEventAt(new Date().toISOString());
          setLastEventId(
            typeof payload.new === "object" &&
              payload.new !== null &&
              "id" in payload.new
              ? String((payload.new as { id: unknown }).id)
              : null,
          );
          onInsertRef.current?.();
        },
      )
      .subscribe((subscriptionStatus, err) => {
        console.log("[RealtimeDebug] subscription status:", subscriptionStatus);
        if (err) {
          console.log("[RealtimeDebug] subscription error:", err);
        }

        if (subscriptionStatus === "SUBSCRIBED") {
          setStatus("connected");
        } else if (
          subscriptionStatus === "CHANNEL_ERROR" ||
          subscriptionStatus === "TIMED_OUT"
        ) {
          setStatus("error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (hideUi) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: "2rem",
        padding: "1rem",
        border: "1px dashed #999",
        fontSize: "0.875rem",
        color: "#444",
      }}
      aria-label="Realtime debug (temporary)"
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Realtime debug (read-only)</p>
      <ul style={{ marginTop: "0.5rem", marginBottom: 0, paddingLeft: "1.25rem" }}>
        <li>
          Status:{" "}
          {status === "connecting"
            ? "connecting…"
            : status === "connected"
              ? "Realtime connected"
              : "subscription error"}
        </li>
        <li>Table: notification_events (INSERT)</li>
        <li>Last event received: {lastEventAt ?? "—"}</li>
        {lastEventId && <li>Last event id: {lastEventId}</li>}
      </ul>
    </section>
  );
}

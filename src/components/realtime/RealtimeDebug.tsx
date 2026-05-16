"use client";

import { useCallback, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useResilientRealtimeChannel } from "@/src/hooks/useResilientRealtimeChannel";
import { useScheduleResyncAfterReconnect } from "@/src/components/sync/RealtimeResyncProvider";

type ConnectionStatus = "connecting" | "connected" | "error";

type RealtimeDebugProps = {
  onInsert?: () => void;
  hideUi?: boolean;
};

export function RealtimeDebug({ onInsert, hideUi = false }: RealtimeDebugProps) {
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;
  const scheduleResync = useScheduleResyncAfterReconnect();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const configureChannel = useCallback(
    (channel: RealtimeChannel) =>
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_events",
        },
        (payload) => {
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
      ),
    [],
  );

  const handleStatusChange = useCallback((subscriptionStatus: string) => {
    if (subscriptionStatus === "SUBSCRIBED") {
      setStatus("connected");
      return;
    }
    if (
      subscriptionStatus === "CHANNEL_ERROR" ||
      subscriptionStatus === "TIMED_OUT" ||
      subscriptionStatus === "CLOSED"
    ) {
      setStatus("error");
    }
  }, []);

  useResilientRealtimeChannel({
    channelName: "realtime-debug-notification-events",
    enabled: true,
    configure: configureChannel,
    onStatusChange: handleStatusChange,
    onReconnect: scheduleResync,
  });

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

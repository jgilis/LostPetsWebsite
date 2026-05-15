"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "../../../src/components/notifications/NotificationsProvider";

const SightingMap = dynamic(() => import("../../../src/components/sightings/SightingMap"), {
  ssr: false,
});

const MODERATION_EVENT_TYPES = new Set([
  "sighting_approved",
  "sighting_rejected",
  "sighting_updated",
]);

type SightingDetail = {
  id: string;
  status: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  report?: unknown;
  [key: string]: unknown;
};

function isModerationEvent(type: string) {
  return MODERATION_EVENT_TYPES.has(type);
}

export default function SightingClient({
  sighting: initialSighting,
}: {
  sighting: SightingDetail;
}) {
  const [sighting, setSighting] = useState(initialSighting);
  const { events } = useNotifications();
  const lastAppliedEventId = useRef<string | null>(null);

  useEffect(() => {
    setSighting(initialSighting);
    lastAppliedEventId.current = null;
  }, [initialSighting]);

  useEffect(() => {
    const moderationEvent = events.find(
      (event) =>
        isModerationEvent(event.type) &&
        event.payload.sighting_id === initialSighting.id,
    );

    if (!moderationEvent) return;
    if (lastAppliedEventId.current === moderationEvent.id) return;

    const nextStatus = moderationEvent.payload.status;
    if (!nextStatus) return;

    lastAppliedEventId.current = moderationEvent.id;

    setSighting((current) => ({
      ...current,
      status: nextStatus,
      latitude: moderationEvent.payload.latitude ?? current.latitude,
      longitude: moderationEvent.payload.longitude ?? current.longitude,
    }));
  }, [events, initialSighting.id]);

  const report = Array.isArray(sighting.report)
    ? sighting.report[0]
    : sighting.report;

  const reportDetails = report as {
    animal_type?: string;
    animal_name?: string | null;
  } | null;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: 24 }}>
        🐾 Sighting Detail
      </h1>
      <SightingMap
        sighting={sighting}
        report={reportDetails}
      />
      <div>
        <h2>
          {reportDetails?.animal_type} {reportDetails?.animal_name || ""}
        </h2>

        <p>{sighting.description || "No description"}</p>

        <p>Status: {sighting.status}</p>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useVisibilitySyncRegister } from "../sync/VisibilitySyncProvider";
import {
  useRealtimeResyncRegister,
  useScheduleResyncAfterReconnect,
} from "../sync/RealtimeResyncProvider";
import { useResilientRealtimeChannel } from "@/src/hooks/useResilientRealtimeChannel";
import {
  getApprovedSightings,
  type Sighting,
} from "@/src/lib/sightings";

export function useApprovedSightings() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSightings = useCallback(async () => {
    const data = await getApprovedSightings();
    setSightings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchSightings();
  }, [fetchSightings]);

  useVisibilitySyncRegister(() => {
    void fetchSightings();
  }, [fetchSightings]);

  useRealtimeResyncRegister(() => {
    void fetchSightings();
  }, [fetchSightings]);

  const scheduleResync = useScheduleResyncAfterReconnect();

  const configureSightingsChannel = useCallback(
    (channel: RealtimeChannel) =>
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sightings" },
        () => {
          void fetchSightings();
        },
      ),
    [fetchSightings],
  );

  useResilientRealtimeChannel({
    channelName: "activity-sightings-channel",
    configure: configureSightingsChannel,
    onReconnect: scheduleResync,
  });

  return { sightings, loading };
}

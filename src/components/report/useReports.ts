import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useVisibilitySyncRegister } from "../sync/VisibilitySyncProvider";
import {
  useRealtimeResyncRegister,
  useScheduleResyncAfterReconnect,
} from "../sync/RealtimeResyncProvider";
import { useResilientRealtimeChannel } from "../../hooks/useResilientRealtimeChannel";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Report {
  id: string;
  type: "lost" | "found";
  animal_type: "dog" | "cat" | "bird" | "rodent" | "other";
  animal_name?: string | null;
  description?: string;
  latitude: number;
  longitude: number;
  contact_info: string;
  photo_url?: string | null;
  status: "active" | "flagged" | "removed" | "resolved" | "expired";
  owner_user_id?: string | null;
}

// 👇 Raw type from DB (includes expires_at and loose typing)
type ReportRow = {
  id: string;
  type: "lost" | "found";
  animal_type: "dog" | "cat" | "bird" | "rodent" | "other";
  animal_name?: string | null;
  description?: string | null;
  latitude: number | string;
  longitude: number | string;
  contact_info: string;
  photo_url?: string | null;
  status?: "active" | "flagged" | "removed" | "resolved" | "expired" | null;
  expires_at?: string | null;
  owner_user_id?: string | null; // ✅ ADD THIS
};

export function useReports(options?: { reportId?: string | null }) {
  const reportId = options?.reportId ?? null;
  const isScoped = !!reportId;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("reports")
      .select(`
        id,
        type,
        animal_type,
        animal_name,
        description,
        latitude,
        longitude,
        contact_info,
        photo_url,
        status,
        expires_at,
        owner_user_id
      `);

    if (reportId) {
      query = query.eq("id", reportId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error.message);
      setLoading(false);
      return;
    }

    const now = new Date();

    const cleaned: Report[] = (data ?? []).map((r: ReportRow) => {
      const expiresAt = r.expires_at ? new Date(r.expires_at) : null;

      let status: Report["status"] = r.status ?? "active";

      // 🧠 auto-expire logic
      if (status === "active" && expiresAt && expiresAt < now) {
        status = "expired";
      }

      return {
        id: r.id,
        type: r.type,
        animal_type: r.animal_type,
        animal_name: r.animal_name ?? null,
        description: r.description ?? "",
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        contact_info: r.contact_info,
        photo_url: r.photo_url ?? null,
        status,
        owner_user_id: r.owner_user_id ?? null,
      };
    });

    setReports(
      isScoped
        ? cleaned
        : cleaned.filter((r) => r.status === "active")
    );
    setLoading(false);
  }, [reportId, isScoped]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  useVisibilitySyncRegister(() => {
    void fetchReports();
  }, [fetchReports]);

  useRealtimeResyncRegister(() => {
    void fetchReports();
  }, [fetchReports]);

  const scheduleResync = useScheduleResyncAfterReconnect();

  const configureReportsChannel = useCallback(
    (channel: RealtimeChannel) =>
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          void fetchReports();
        },
      ),
    [fetchReports],
  );

  useResilientRealtimeChannel({
    channelName: "reports-channel",
    enabled: !isScoped,
    configure: configureReportsChannel,
    onReconnect: scheduleResync,
  });

  return { reports, loading };
}
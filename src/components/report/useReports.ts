import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  isPublicMapReport,
  normalizeReportRow,
  REPORT_PUBLIC_SELECT,
  type Report,
} from "../../lib/reports";
import { useVisibilitySyncRegister } from "../sync/VisibilitySyncProvider";
import {
  useRealtimeResyncRegister,
  useScheduleResyncAfterReconnect,
} from "../sync/RealtimeResyncProvider";
import { useResilientRealtimeChannel } from "../../hooks/useResilientRealtimeChannel";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type { Report };

type ReportRow = Parameters<typeof normalizeReportRow>[0];

export function useReports(options?: { reportId?: string | null }) {
  const reportId = options?.reportId ?? null;
  const isScoped = !!reportId;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);

    let query = supabase.from("reports").select(REPORT_PUBLIC_SELECT);

    if (reportId) {
      query = query.eq("id", reportId);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error.message);
      setLoading(false);
      return;
    }

    const cleaned = (data ?? []).map((r) =>
      normalizeReportRow(r as ReportRow),
    );

    setReports(
      isScoped ? cleaned : cleaned.filter(isPublicMapReport),
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

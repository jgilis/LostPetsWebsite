import { supabase } from "./supabase";
import {
  MAX_ANIMAL_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_DESCRIPTION_LENGTH,
} from "./reportValidation";

export type ReportStatus =
  | "active"
  | "flagged"
  | "removed"
  | "resolved"
  | "expired";

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
  status: ReportStatus;
  owner_user_id?: string | null;
  created_at?: string;
  date_reported?: string;
  resolved_at?: string | null;
}

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
  status?: ReportStatus | null;
  expires_at?: string | null;
  owner_user_id?: string | null;
  created_at?: string | null;
  date_reported?: string | null;
  resolved_at?: string | null;
};

export const REPORT_PUBLIC_SELECT = `
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
  owner_user_id,
  created_at,
  date_reported,
  resolved_at
`;

// Columns remaining after edit_token is revoked from the Data API.
export const REPORT_ADMIN_SELECT = `
  id,
  type,
  animal_type,
  animal_name,
  description,
  latitude,
  longitude,
  photo_url,
  status,
  date_reported,
  expires_at,
  owner_user_id,
  created_at,
  resolved_at
`;

export const FLAG_ADMIN_SELECT = "id, report_id, reason, created_at";

export type AdminFlagRow = {
  id: string;
  report_id: string;
  reason: string | null;
  created_at: string;
};

export function normalizeReportRow(r: ReportRow): Report {
  const now = new Date();
  const expiresAt = r.expires_at ? new Date(r.expires_at) : null;

  let status: ReportStatus = r.status ?? "active";

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
    created_at: r.created_at ?? undefined,
    date_reported: r.date_reported ?? undefined,
    resolved_at: r.resolved_at ?? null,
  };
}

/** Map: active reports only. */
export function isPublicMapReport(report: Report): boolean {
  return report.status === "active";
}

/** Feed: active and resolved (reunited); never flagged/removed/expired. */
export function isPublicFeedReport(report: Report): boolean {
  return report.status === "active" || report.status === "resolved";
}

export async function getReportById(id: string): Promise<Report | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_PUBLIC_SELECT)
    .eq("id", trimmed)
    .maybeSingle();

  if (error) {
    console.error("getReportById error:", error);
    return null;
  }

  if (!data) return null;

  const report = normalizeReportRow(data as ReportRow);
  if (!isPublicFeedReport(report)) return null;

  return report;
}

export async function getAllReports() {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_ADMIN_SELECT)
    .order("date_reported", { ascending: false });

  if (error) {
    console.error("getAllReports error:", error);
    return [];
  }

  return data || [];
}

// ADMIN ONLY (temporary bridge layer)

export async function getFlaggedReportsWithFlags() {
  const { data: flags, error: flagsError } = await supabase
    .from("reports_flags")
    .select(FLAG_ADMIN_SELECT)
    .order("created_at", { ascending: false });

  if (flagsError) {
    console.error("getFlaggedReportsWithFlags flags error:", flagsError);
    return { reports: [], flags: [], error: flagsError.message };
  }

  const flagRows = (flags || []) as AdminFlagRow[];
  const reportIds = [
    ...new Set(
      flagRows
        .map((flag) => flag.report_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  if (reportIds.length === 0) {
    return { reports: [], flags: flagRows };
  }

  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select(REPORT_ADMIN_SELECT)
    .in("id", reportIds);

  if (reportsError) {
    console.error("getFlaggedReportsWithFlags reports error:", reportsError);
    return { reports: [], flags: flagRows, error: reportsError.message };
  }

  return { reports: reports || [], flags: flagRows };
}

export function canOwnerEditReportDetails(status: ReportStatus): boolean {
  return status === "active" || status === "resolved";
}

export function canOwnerEditPhotoAndPin(status: ReportStatus): boolean {
  return status === "active";
}

export async function getOwnerReportById(
  id: string,
  ownerUserId: string,
): Promise<Report | null> {
  const trimmed = id.trim();
  if (!trimmed || !ownerUserId) return null;

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_PUBLIC_SELECT)
    .eq("id", trimmed)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error) {
    console.error("getOwnerReportById error:", error);
    return null;
  }

  if (!data) return null;
  return normalizeReportRow(data as ReportRow);
}

export async function updateOwnerReportDetails(
  reportId: string,
  ownerUserId: string,
  fields: {
    description: string;
    animal_name: string;
    latitude?: number;
    longitude?: number;
    photoBase64?: string;
  },
): Promise<{
  ok: boolean;
  report?: {
    latitude: number;
    longitude: number;
    photo_url: string | null;
  };
}> {
  const description = fields.description.trim();
  const animal_name = fields.animal_name.trim();
  if (
    description.length < MIN_DESCRIPTION_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    animal_name.length > MAX_ANIMAL_NAME_LENGTH
  ) {
    return { ok: false };
  }

  const pinChanged =
    typeof fields.latitude === "number" &&
    typeof fields.longitude === "number";
  const photoChanged = Boolean(fields.photoBase64);

  if (pinChanged || photoChanged) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      return { ok: false };
    }

    const res = await fetch(
      "https://dmubikdkyusadzqngapy.supabase.co/functions/v1/owner-update-report",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          report_id: reportId,
          description,
          animal_name,
          ...(pinChanged
            ? { latitude: fields.latitude, longitude: fields.longitude }
            : {}),
          ...(photoChanged ? { photo_base64: fields.photoBase64 } : {}),
        }),
      },
    );

    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success || !payload.report) {
      console.error("updateOwnerReportDetails function error:", payload);
      return { ok: false };
    }

    return {
      ok: true,
      report: {
        latitude: Number(payload.report.latitude),
        longitude: Number(payload.report.longitude),
        photo_url: payload.report.photo_url ?? null,
      },
    };
  }

  const { data, error } = await supabase
    .from("reports")
    .update({ description, animal_name })
    .eq("id", reportId)
    .eq("owner_user_id", ownerUserId)
    .in("status", ["active", "resolved"])
    .select("id");

  if (error || !data?.length) {
    console.error("updateOwnerReportDetails error:", error);
    return { ok: false };
  }

  return { ok: true };
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
) {
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}
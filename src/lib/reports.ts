import { supabase } from "./supabase";

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
  date_reported
`;

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
  };
}

/** Same visibility as map and feed (active after auto-expire). */
export function isPublicMapReport(report: Report): boolean {
  return report.status === "active";
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
  if (!isPublicMapReport(report)) return null;

  return report;
}

export async function getAllReports() {
  const { data, error } = await supabase
    .from("reports")
    .select(`
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
      expires_at
    `)
    .order("date_reported", { ascending: false });

  if (error) {
    console.error("getAllReports error:", error);
    return [];
  }

  return data || [];
}

// ADMIN ONLY (temporary bridge layer)

export async function getFlaggedReportsWithFlags() {
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("status", "flagged");

  const { data: flags } = await supabase
    .from("reports_flags")
    .select("*")
    .order("created_at", { ascending: false });

  return { reports: reports || [], flags: flags || [] };
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
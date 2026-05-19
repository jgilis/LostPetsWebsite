import { supabase } from "./supabase";
import { normalizeRelation } from "./supabase-normalize";

export type SightingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export  type AdminSightingRaw = {
  id: string;
  lost_report_id: string;
  latitude: number;
  longitude: number;
  description: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  reports: {
    id: string;
    latitude: number;
    longitude: number;
    animal_type: string;
    animal_name: string | null;
    owner_user_id: string | null;
  }[];
};

//
// CLIENT-SAFE TYPE
//
export interface Sighting {
  id: string;
  lost_report_id: string;
  created_at: string;
  latitude: number;
  longitude: number;
  location_accuracy_meters?: number | null;
  description?: string | null;
  photo_url?: string | null;
  status: SightingStatus;
  moderated_at?: string | null;
  expires_at?: string | null;
}

// INTERNAL / ADMIN TYPE
export interface AdminSighting extends Sighting {
  reporter_ip_hash: string;

  moderation_reason?: string | null;

  reviewed_by?: string | null;
}

function getReport(
  report:
    | { owner_user_id: string | null }
    | { owner_user_id: string | null }[]
    | null
    | undefined
) {
  if (!report) return null;

  return Array.isArray(report) ? report[0] : report;
}

export async function getApprovedSightings(
  lostReportId: string
): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("sightings")
    .select(`
      id,
      lost_report_id,
      created_at,
      latitude,
      longitude,
      location_accuracy_meters,
      description,
      photo_url,
      status,
      moderated_at,
      expires_at
    `)
    .eq("lost_report_id", lostReportId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export async function getPublicSightingById(id: string) {
  const { data: sighting, error } = await supabase
    .from("sightings")
    .select(`
      id,
      lost_report_id,
      created_at,
      latitude,
      longitude,
      description,
      photo_url,
      status
    `)
    .eq("id", id)
    .single();

  if (error || !sighting) {
    console.error("Sighting error:", error);
    return null;
  }

  const { data: report } = await supabase
    .from("reports")
    .select(`
      id,
      latitude,
      longitude,
      animal_type,
      animal_name,
      owner_user_id
    `)
    .eq("id", sighting.lost_report_id)
    .maybeSingle();

  return {
    ...sighting,
    report: report ?? null,
  };
}

export async function getAdminSightings() {
  const { data, error } = await supabase
    .from("sightings")
    .select(`
      id,
      lost_report_id,
      latitude,
      longitude,
      description,
      photo_url,
      status,
      created_at,
      reports:lost_report_id (
        id,
        latitude,
        longitude,
        animal_type,
        animal_name,
        owner_user_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  const typed = (data || []) as unknown as AdminSightingRaw[];

  // normalize array → object
  return typed.map((s) => ({
    ...s,
    reports: normalizeRelation(s.reports),
  }));
}

export async function getAdminSightingById(id: string) {

  const { data: sighting, error } = await supabase
    .from("sightings")
    .select(`
      id,
      lost_report_id,
      latitude,
      longitude,
      description,
      photo_url,
      status,
      created_at
    `)
    .eq("id", id)
    .single();

  if (error || !sighting) {
    console.error(error);
    return null;
  }

  const reportId = String(sighting.lost_report_id).trim();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select(`
      id,
      latitude,
      longitude,
      animal_type,
      animal_name,
      owner_user_id
    `)
    .eq("id", reportId)
    .maybeSingle();

  return {
    ...sighting,
    reports: report ?? null,
  };
}

export async function updateSightingStatus(
  id: string,
  status: "approved" | "rejected" | "removed" | "pending"
) {
  // 1. update sighting
  const { error: updateError } = await supabase
    .from("sightings")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    return false;
  }

  // 2. fetch fresh sighting data
  const { data: sighting, error: sightingError } = await supabase
    .from("sightings")
    .select(`
      id,
      lost_report_id,
      latitude,
      longitude,
      status,
      reports:lost_report_id (
        owner_user_id
      )
    `)
    .eq("id", id)
    .single();

  if (sightingError || !sighting) {
    console.error(sightingError);
    return false;
  }

  const report = getReport(sighting.reports);

  // Notify report owner only when a sighting is approved (not rejected/removed/etc.).
  if (status !== "approved") {
    return true;
  }

  const { error: eventError } = await supabase
    .from("notification_events")
    .insert({
      type: "sighting_approved",
      target_user_id: report?.owner_user_id ?? null,
      payload: {
        sighting_id: sighting.id,
        lost_report_id: sighting.lost_report_id,
        latitude: sighting.latitude,
        longitude: sighting.longitude,
        status: sighting.status,
      },
    });

  if (eventError) {
    console.error(eventError);
    return false;
  }

  return true;
}
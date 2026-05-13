import { supabase } from "./supabase";

export type SightingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

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

//
// INTERNAL / ADMIN TYPE
//
export interface AdminSighting extends Sighting {
  reporter_ip_hash: string;

  moderation_reason?: string | null;

  reviewed_by?: string | null;
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
    .eq("status", "approved")
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
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  console.log("RAW SIGHTING:", data);
  return data;
}

export async function getAdminSightingById(id: string) {
  const { data, error } = await supabase
    .from("sightings")
    .select(`
      *,
      reports:lost_report_id (
        id,
        animal_type,
        animal_name,
        latitude,
        longitude,
        owner_user_id
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  console.log("ADMIN SIGHTING:", data);
  return data;
}
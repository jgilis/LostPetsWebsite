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
  latitude?: number | null;
  longitude?: number | null;
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

// Columns the Data API may return to anon and authenticated.
// Exact coordinates are loaded separately for an owner or administrator.
export const PUBLIC_SIGHTING_COLUMNS = [
  "id",
  "lost_report_id",
  "created_at",
  "description",
  "photo_url",
  "status",
  "moderated_at",
  "expires_at",
].join(", ");

//
// CLIENT-SAFE TYPE
//
export interface Sighting {
  id: string;
  lost_report_id: string;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
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

type ExactCoordinateRow = {
  id: string;
  latitude: number | string;
  longitude: number | string;
};

type PostgrestFailure = {
  code?: string;
  message?: string;
};

function isCoordinatesRpcMissing(error: PostgrestFailure) {
  if (error.code === "PGRST202") return true;
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("sighting_exact_coordinates") &&
    message.includes("could not find")
  );
}

function isPrivilegeDenied(error: PostgrestFailure) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42501" ||
    message.includes("permission denied") ||
    message.includes("row-level security")
  );
}

export async function withExactCoordinates<T extends { id: string }>(
  rows: T[],
): Promise<Array<T & { latitude: number | null; longitude: number | null }>> {
  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => row.id);
  const { data, error } = await supabase.rpc("sighting_exact_coordinates", {
    p_ids: ids,
  });

  let coordinates: ExactCoordinateRow[] = [];
  if (!error && Array.isArray(data)) {
    coordinates = data as ExactCoordinateRow[];
  } else if (error && isCoordinatesRpcMissing(error)) {
    // Current database, before the security migration creates the function.
    const { data: legacy, error: legacyError } = await supabase
      .from("sightings")
      .select("id, latitude, longitude")
      .in("id", ids);
    if (!legacyError && Array.isArray(legacy)) {
      coordinates = legacy as ExactCoordinateRow[];
    }
  }

  const byId = new Map(coordinates.map((row) => [row.id, row]));

  return rows.map((row) => {
    const exact = byId.get(row.id);
    return {
      ...row,
      latitude: exact == null ? null : Number(exact.latitude),
      longitude: exact == null ? null : Number(exact.longitude),
    };
  });
}

export async function getApprovedSightings(
  lostReportId: string
): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("sightings")
    .select(PUBLIC_SIGHTING_COLUMNS)
    .eq("lost_report_id", lostReportId)
    .eq("status", "approved")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as unknown as Sighting[];
}

export async function getReportSightings(
  lostReportId: string
): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("sightings")
    .select(PUBLIC_SIGHTING_COLUMNS)
    .eq("lost_report_id", lostReportId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return (data ?? []) as unknown as Sighting[];
}

export async function getPublicSightingById(id: string) {
  const { data: sighting, error } = await supabase
    .from("sightings")
    .select(PUBLIC_SIGHTING_COLUMNS)
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (error || !sighting) {
    console.error("Sighting error:", error);
    return null;
  }

  const sightingRow = sighting as unknown as Sighting;

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
    .eq("id", sightingRow.lost_report_id)
    .maybeSingle();

  return {
    ...sightingRow,
    report: report ?? null,
  };
}

export async function getAdminSightings() {
  const { data, error } = await supabase
    .from("sightings")
    .select(`
      id,
      lost_report_id,
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
  const normalized = typed.map((s) => ({
    ...s,
    reports: normalizeRelation(s.reports),
  }));

  return withExactCoordinates(normalized);
}

export async function getAdminSightingById(id: string) {

  const { data: sighting, error } = await supabase
    .from("sightings")
    .select(`
      id,
      lost_report_id,
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
    .eq("id", reportId)
    .maybeSingle();

  const [withLocation] = await withExactCoordinates([sighting]);

  return {
    ...withLocation,
    reports: report ?? null,
  };
}

export async function updateSightingStatus(
  id: string,
  status: "approved" | "rejected" | "removed" | "pending"
) {
  const { error: updateError } = await supabase
    .from("sightings")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    console.error(updateError);
    return false;
  }

  if (status !== "approved") {
    return true;
  }

  // Before the security migration, this client insert is the notification.
  // After it, coordinate reads and notification inserts are denied and the
  // approval trigger has already notified the report owner.
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
    if (sightingError && !isPrivilegeDenied(sightingError)) {
      console.error(sightingError);
      return false;
    }
    return true;
  }

  const report = normalizeRelation(
    sighting.reports as { owner_user_id: string | null } | { owner_user_id: string | null }[],
  );

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

  if (eventError && !isPrivilegeDenied(eventError)) {
    console.error(eventError);
    return false;
  }

  return true;
}
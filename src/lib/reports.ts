import { supabase } from "./supabase";

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
  status: "active" | "flagged" | "removed" | "resolved" | "expired"
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
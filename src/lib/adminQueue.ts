import { isReportOutOfMechelen } from "./mechelenBounds";
import { supabase } from "./supabase";

export type AdminQueueCounts = {
  pendingSightings: number;
  flaggedReports: number;
  outOfAreaReports: number;
};

export async function getAdminQueueCounts(): Promise<AdminQueueCounts> {
  const [pending, flagged, active] = await Promise.all([
    supabase
      .from("sightings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "flagged"),
    supabase
      .from("reports")
      .select("id, latitude, longitude")
      .eq("status", "active"),
  ]);

  const outOfAreaReports = (active.data ?? []).filter((row) =>
    isReportOutOfMechelen(row.latitude, row.longitude),
  ).length;

  return {
    pendingSightings: pending.count ?? 0,
    flaggedReports: flagged.count ?? 0,
    outOfAreaReports,
  };
}

export async function getModerationActions(limit = 200) {
  const { data, error } = await supabase
    .from("moderation_actions")
    .select("id, actor_id, target_type, target_id, action, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

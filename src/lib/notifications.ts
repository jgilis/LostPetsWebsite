import { AREA_NOTIFICATION_TYPE } from "./areaSubscriptions";
import { supabase } from "./supabase";

const NOTIFICATION_TYPES = ["sighting_approved", AREA_NOTIFICATION_TYPE] as const;
const NOTIFICATION_SELECT = "id, type, payload, created_at, read_at";

async function getAuthUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function getUnreadNotificationCount() {
  const userId = await getAuthUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("notification_events")
    .select("id", { count: "exact", head: true })
    .eq("target_user_id", userId)
    .in("type", [...NOTIFICATION_TYPES])
    .is("read_at", null);

  if (error) {
    console.error(error);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationsAsRead() {
  const userId = await getAuthUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("notification_events")
    .update({ read_at: new Date().toISOString() })
    .eq("target_user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}

export async function getOwnerSightingsNotifications() {
  const userId = await getAuthUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notification_events")
    .select(NOTIFICATION_SELECT)
    .eq("target_user_id", userId)
    .in("type", [...NOTIFICATION_TYPES])
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

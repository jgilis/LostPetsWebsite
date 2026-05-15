import { supabase } from "./supabase";
import { getOwnerToken } from "./owner";

export async function getUnreadNotificationCount() {
  const ownerToken = getOwnerToken();

  if (!ownerToken) return 0;

  const { count, error } = await supabase
    .from("notification_events")
    .select("*", { count: "exact", head: true })
    .eq("target_user_id", ownerToken)
    .is("read_at", null);

  if (error) {
    console.error(error);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationsAsRead() {
  const ownerToken = getOwnerToken();

  if (!ownerToken) return false;

  const { error } = await supabase
    .from("notification_events")
    .update({ read_at: new Date().toISOString() })
    .eq("target_user_id", ownerToken)
    .is("read_at", null);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}

export async function getOwnerSightingsNotifications() {
  const ownerToken = getOwnerToken();

  if (!ownerToken) return [];

  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("target_user_id", ownerToken) // keep this
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}